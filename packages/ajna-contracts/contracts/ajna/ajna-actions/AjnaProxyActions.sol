// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.15;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import { PoolInfoUtils } from "../PoolInfoUtils.sol";
import { ERC20Pool } from "../ERC20Pool.sol";
import { RewardsManager } from "../RewardsManager.sol";
import { PositionManager } from "../PositionManager.sol";
import { IPositionManagerOwnerActions } from "../interfaces/position/IPositionManagerOwnerActions.sol";
import { IRewardsManagerOwnerActions } from "../interfaces/rewards/IRewardsManagerOwnerActions.sol";

import { IAccountGuard } from "../../interfaces/dpm/IAccountGuard.sol";
import { IWETH } from "../../interfaces/tokens/IWETH.sol";

contract AjnaProxyActions {
    PoolInfoUtils public immutable poolInfoUtils;
    IPositionManagerOwnerActions public immutable positionManager;
    IRewardsManagerOwnerActions public immutable rewardsManager;
    IERC20 public immutable ajnaToken;
    address public immutable WETH;
    address public immutable ARC;
    address public immutable GUARD;

    constructor(
        PoolInfoUtils _poolInfoUtils,
        PositionManager _positionManager,
        RewardsManager _rewardsManager,
        IERC20 _ajnaToken,
        address _WETH,
        address _ARC,
        address _GUARD
    ) {
        poolInfoUtils = _poolInfoUtils;
        positionManager = _positionManager;
        rewardsManager = _rewardsManager;
        ajnaToken = _ajnaToken;
        WETH = _WETH;
        ARC = _ARC;
        GUARD = _GUARD;
    }

    /**
     * @dev Emitted once an Operation has completed execution
     * @param name The address initiating the deposit
     **/
    event ProxyActionsOperation(bytes32 indexed name);

    /**
     * @dev Emitted when a new position is created
     * @param proxyAddress The address of the newly created position proxy contract
     * @param protocol The name of the protocol associated with the position
     * @param positionType The type of position being created (e.g. long or short)
     * @param collateralToken The address of the collateral token being used for the position
     * @param debtToken The address of the debt token being used for the position
     **/
    event CreatePosition(
        address indexed proxyAddress,
        string protocol,
        string positionType,
        address collateralToken,
        address debtToken
    );

    function _send(address token, uint256 amount) internal {
        if (token == WETH) {
            IWETH(WETH).withdraw(amount);
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).transfer(msg.sender, amount);
        }
    }

    function _pull(address token, uint256 amount) internal {
        if (token == WETH) {
            IWETH(WETH).deposit{ value: amount }();
        } else {
            IERC20(token).transferFrom(msg.sender, address(this), amount);
        }
    }

    /**
     *  @notice Mints and empty NFT for the user, NFT is bound to a specific pool.
     *  @param  pool            Address of the Ajana Pool.
     *  @return  tokenId  - id of the minted NFT
     */
    function mintNft(ERC20Pool pool) internal returns (uint256 tokenId) {
        IPositionManagerOwnerActions.MintParams memory mintParams = IPositionManagerOwnerActions.MintParams(
            address(this),
            address(pool),
            keccak256("ERC20_NON_SUBSET_HASH")
        );
        // currently won't work in the context of DSProxy or DPM account as they need to accept ERC721 transfers first
        tokenId = positionManager.mint(mintParams);
        if (!IAccountGuard(GUARD).canCall(address(this), ARC)) {
            IAccountGuard(GUARD).permit(ARC, address(this), true);
        }
    }

    /**
     *  @notice Redeem bucket from NFT
     *  @param  price         Price of the momorialized bucket
     *  @param  tokenId       Nft ID
     *  @param  pool          Pool address
     */

    function redeemPosition(uint256 price, uint256 tokenId, address pool) internal {
        uint256 index = convertPriceToIndex(price);
        uint256[] memory indexes = new uint256[](1);
        indexes[0] = index;
        IPositionManagerOwnerActions.RedeemPositionsParams memory redeemParams = IPositionManagerOwnerActions
            .RedeemPositionsParams(tokenId, address(pool), indexes);
        address[] memory addresses = new address[](1);
        addresses[0] = address(positionManager);
        ERC20Pool(pool).approveLPTransferors(addresses);
        positionManager.reedemPositions(redeemParams);
    }

    /**
     *  @notice Memorialize bucket in NFT
     *  @param  price         Price of the momorialized bucket
     *  @param  tokenId       Nft ID
     */
    function memorializeLiquidity(uint256 price, uint256 tokenId, ERC20Pool pool) internal {
        uint256 index = convertPriceToIndex(price);

        (uint256 lpCount, ) = ERC20Pool(pool).lenderInfo(index, address(this));
        uint256[] memory indexes = new uint256[](1);
        indexes[0] = index;
        uint256[] memory lpCounts = new uint256[](1);
        lpCounts[0] = lpCount;
        ERC20Pool(pool).increaseLPAllowance(address(positionManager), indexes, lpCounts);
        IPositionManagerOwnerActions.MemorializePositionsParams memory memorializeParams = IPositionManagerOwnerActions
            .MemorializePositionsParams(tokenId, indexes);
        positionManager.memorializePositions(memorializeParams);
        ERC721(address(positionManager)).approve(address(rewardsManager), tokenId);
    }

    /**
     *  @notice Move LP from one bucket to another while momorialzied in NFT, requires unstaked NFT
     *  @param  oldPrice      Old price of the momorialized bucket
     *  @param  newPrice      New price of the momorialized bucket
     *  @param  tokenId       Nft ID
     *  @param  pool           Pool address
     */
    function moveLiquidity(uint256 oldPrice, uint256 newPrice, uint256 tokenId, address pool) internal {
        uint256 oldIndex = convertPriceToIndex(oldPrice);
        uint256 newIndex = convertPriceToIndex(newPrice);

        IPositionManagerOwnerActions.MoveLiquidityParams memory moveParams = IPositionManagerOwnerActions
            .MoveLiquidityParams(tokenId, pool, oldIndex, newIndex, block.timestamp + 1);
        positionManager.moveLiquidity(moveParams);
        ERC721(address(positionManager)).approve(address(rewardsManager), tokenId);
    }

    /**
     *  @notice Called internally to add an amount of credit at a specified price bucket.
     *  @param  pool         Address of the Ajana Pool.
     *  @param  amount       The maximum amount of quote token to be moved by a lender.
     *  @param  price        The price the bucket to which the quote tokens will be added.
     *  @dev price of uint (10**decimals) collateral token in debt token (10**decimals) with 3 decimal points for instance
     *  @dev 1WBTC = 16,990.23 USDC   translates to: 16990230
     */
    function supplyQuoteInternal(ERC20Pool pool, uint256 amount, uint256 price) internal {
        address debtToken = pool.quoteTokenAddress();
        _pull(debtToken, amount);
        uint256 index = convertPriceToIndex(price);
        IERC20(debtToken).approve(address(pool), amount);
        pool.addQuoteToken(amount * pool.quoteTokenScale(), index, block.timestamp + 1);
    }

    /**
     *  @notice Called internally to move max amount of credit from a specified price bucket to another specified price bucket.
     *  @param  pool         Address of the Ajana Pool.
     *  @param  oldPrice        The price of the bucket  from which the quote tokens will be removed.
     *  @param  newPrice     The price of the bucket to which the quote tokens will be added.
     */
    function moveQuoteInternal(ERC20Pool pool, uint256 oldPrice, uint256 newPrice) internal {
        uint256 oldIndex = convertPriceToIndex(oldPrice);
        pool.moveQuoteToken(type(uint256).max, oldIndex, convertPriceToIndex(newPrice), block.timestamp + 1);
    }

    /**
     *  @notice Called internally to remove an amount of credit at a specified price bucket.
     *  @param  pool         Address of the Ajana Pool.
     *  @param  amount       The maximum amount of quote token to be moved by a lender.
     *  @param  price        The price the bucket to which the quote tokens will be added.
     *  @dev price of uint (10**decimals) collateral token in debt token (10**decimals) with 3 decimal points for instance
     *  @dev 1WBTC = 16,990.23 USDC   translates to: 16990230
     */
    function withdrawQuoteInternal(ERC20Pool pool, uint256 amount, uint256 price) internal {
        address debtToken = pool.quoteTokenAddress();
        uint256 index = convertPriceToIndex(price);
        uint256 balanceBefore = IERC20(debtToken).balanceOf(address(this));
        if (amount == type(uint256).max) {
            pool.removeQuoteToken(type(uint256).max, index);
        } else {
            pool.removeQuoteToken((amount * pool.quoteTokenScale()), index);
        }
        uint256 withdrawnBalance = IERC20(debtToken).balanceOf(address(this)) - balanceBefore;
        _send(debtToken, withdrawnBalance);
    }

    /**
     * @notice Reclaims collateral from liquidated bucket
     * @param  pool         Address of the Ajana Pool.
     * @param  price        Price of the bucket to redeem.
     */
    function removeCollateralInternal(ERC20Pool pool, uint256 price) internal {
        address collateralToken = pool.collateralAddress();
        uint256 index = convertPriceToIndex(price);
        uint256 balanceBefore = IERC20(collateralToken).balanceOf(address(this));
        pool.removeCollateral(type(uint256).max, index);
        uint256 withdrawnBalance = IERC20(collateralToken).balanceOf(address(this)) - balanceBefore;
        _send(collateralToken, withdrawnBalance);
    }

    // BORROWER ACTIONS

    /**
     *  @notice Deposit collateral
     *  @param  pool           Pool address
     *  @param  collateralAmount Amount of collateral to deposit
     *  @param  price          Price of the bucket
     */
    function depositCollateral(ERC20Pool pool, uint256 collateralAmount, uint256 price) public payable {
        address collateralToken = pool.collateralAddress();
        _pull(collateralToken, collateralAmount);

        uint256 index = convertPriceToIndex(price);
        IERC20(collateralToken).approve(address(pool), collateralAmount);
        pool.drawDebt(address(this), 0, index, collateralAmount * pool.collateralScale());
    }

    /**
     *  @notice Withdraw collateral
     *  @param  pool           Pool address
     *  @param  amount         Amount of collateral to withdraw
     */
    function withdrawCollateral(ERC20Pool pool, uint256 amount) public {
        address collateralToken = pool.collateralAddress();
        (, , , , , uint256 lupIndex_) = poolInfoUtils.poolPricesInfo(address(pool));
        pool.repayDebt(address(this), 0, amount * pool.collateralScale(), address(this), lupIndex_);
        _send(collateralToken, amount);
    }

    /**
     *  @notice Draw debt
     *  @param  pool           Pool address
     *  @param  debtAmount     Amount of debt to draw
     *  @param  price          Price of the bucket
     */
    function drawDebt(ERC20Pool pool, uint256 debtAmount, uint256 price) public {
        address debtToken = pool.quoteTokenAddress();
        uint256 index = convertPriceToIndex(price);

        pool.drawDebt(address(this), debtAmount * pool.quoteTokenScale(), index, 0);
        _send(debtToken, debtAmount);
    }

    /**
     *  @notice Repay debt
     *  @param  pool           Pool address
     *  @param  amount         Amount of debt to repay
     */
    function repayDebt(ERC20Pool pool, uint256 amount) public payable {
        address debtToken = pool.quoteTokenAddress();
        _pull(debtToken, amount);
        IERC20(debtToken).approve(address(pool), amount);
        (, , , , , uint256 lupIndex_) = poolInfoUtils.poolPricesInfo(address(pool));
        pool.repayDebt(address(this), amount * pool.quoteTokenScale(), 0, address(this), lupIndex_);
    }

    /**
     *  @notice Deposit collateral and draw debt
     *  @param  pool           Pool address
     *  @param  debtAmount     Amount of debt to borrow
     *  @param  collateralAmount Amount of collateral to deposit
     *  @param  price          Price of the bucket
     */
    function depositAndDraw(
        ERC20Pool pool,
        uint256 debtAmount,
        uint256 collateralAmount,
        uint256 price
    ) public payable {
        if (collateralAmount > 0) {
            depositCollateral(pool, collateralAmount, price);
        }
        if (debtAmount > 0) {
            drawDebt(pool, debtAmount, price);
        }
        if (debtAmount > 0 && collateralAmount > 0) {
            emit ProxyActionsOperation("AjnaDepositBorrow");
        } else if (debtAmount > 0) {
            emit ProxyActionsOperation("AjnaBorrow");
        } else if (collateralAmount > 0) {
            emit ProxyActionsOperation("AjnaDeposit");
        }
    }

    /**
     *  @notice Open position for msg.sender
     *  @param  pool           Pool address
     *  @param  debtAmount     Amount of debt to borrow
     *  @param  collateralAmount Amount of collateral to deposit
     *  @param  price          Price of the bucket
     */
    function openPosition(ERC20Pool pool, uint256 debtAmount, uint256 collateralAmount, uint256 price) public payable {
        depositAndDraw(pool, debtAmount, collateralAmount, price);
        emit CreatePosition(address(this), "Ajna", "Borrow", pool.collateralAddress(), pool.quoteTokenAddress());
    }

    /**
     *  @notice Open Earn position for msg.sender
     *  @param  pool           Pool address
     *  @param  depositAmount     Amount of debt to borrow
     *  @param  price          Price of the bucket
     */
    function openEarnPosition(ERC20Pool pool, uint256 depositAmount, uint256 price) public payable {
        supplyQuoteInternal(pool, depositAmount, price);
        emit CreatePosition(address(this), "Ajna", "Earn", pool.collateralAddress(), pool.quoteTokenAddress());
    }

    /**
     *  @notice Open Earn (with NFT) position for msg.sender
     *  @param  pool           Pool address
     *  @param  depositAmount     Amount of debt to borrow
     *  @param  price          Price of the bucket
     */
    function openEarnPositionNft(ERC20Pool pool, uint256 depositAmount, uint256 price) public payable {
        supplyQuoteMintNftAndStake(pool, depositAmount, price);
        emit CreatePosition(address(this), "Ajna", "Earn", pool.collateralAddress(), pool.quoteTokenAddress());
    }

    /**
     *  @notice Repay debt and withdraw collateral for msg.sender
     *  @param  pool           Pool address
     *  @param  debtAmount     Amount of debt to repay
     *  @param  collateralAmount Amount of collateral to withdraw
     */
    function repayWithdraw(ERC20Pool pool, uint256 debtAmount, uint256 collateralAmount) public {
        if (debtAmount > 0) {
            repayDebt(pool, debtAmount);
        }
        if (collateralAmount > 0) {
            withdrawCollateral(pool, collateralAmount);
        }
        if (debtAmount > 0 && collateralAmount > 0) {
            emit ProxyActionsOperation("AjnaRepayWithdraw");
        } else if (debtAmount > 0) {
            emit ProxyActionsOperation("AjnaRepay");
        } else if (collateralAmount > 0) {
            emit ProxyActionsOperation("AjnaWithdraw");
        }
    }

    /**
     *  @notice Repay debt and close position for msg.sender
     *  @param  pool           Pool address
     */
    function repayAndClose(ERC20Pool pool) public payable {
        address collateralToken = pool.collateralAddress();
        address debtToken = pool.quoteTokenAddress();

        (uint256 debt, uint256 collateral, ) = poolInfoUtils.borrowerInfo(address(pool), address(this));
        // TODO : depends on https://github.com/ajna-finance/contracts/pull/553
        // add 1 unit (quote token decimals )to the debt to avoid rounding errors
        uint256 debtPlusBuffer = ((debt / pool.quoteTokenScale()) + 1) * pool.quoteTokenScale();
        uint256 amountDebt = debtPlusBuffer / pool.quoteTokenScale();
        _pull(debtToken, amountDebt);

        IERC20(debtToken).approve(address(pool), amountDebt);
        (, , , , , uint256 lupIndex_) = poolInfoUtils.poolPricesInfo(address(pool));
        pool.repayDebt(address(this), debtPlusBuffer, collateral, address(this), lupIndex_);

        uint256 amountCollateral = collateral / pool.collateralScale();
        _send(collateralToken, amountCollateral);
    }

    /**
     *  @notice Called by lenders to add an amount of credit at a specified price bucket.
     *  @param  pool         Address of the Ajana Pool.
     *  @param  amount       The maximum amount of quote token to be moved by a lender.
     *  @param  price        The price the bucket to which the quote tokens will be added.
     *  @dev price of uint (10**decimals) collateral token in debt token (10**decimals) with 3 decimal points for instance
     *  @dev 1WBTC = 16,990.23 USDC   translates to: 16990230
     */
    function supplyQuote(ERC20Pool pool, uint256 amount, uint256 price) public payable {
        supplyQuoteInternal(pool, amount, price);
        emit ProxyActionsOperation("AjnaSupplyQuote");
    }

    /**
     *  @notice Called by lenders to add an amount of credit at a specified price bucket.
     *  @param  pool         Address of the Ajana Pool.
     *  @param  amount       The maximum amount of quote token to be moved by a lender.
     *  @param  index        Index of the bucket to which the quote tokens will be added.
     *  @dev price of uint (10**decimals) collateral token in debt token (10**decimals) with 3 decimal points for instance
     *  @dev 1WBTC = 16,990.23 USDC   translates to: 16990230
     */
    function supplyQuoteIndex(ERC20Pool pool, uint256 amount, uint256 index) public payable {
        address debtToken = pool.quoteTokenAddress();
        _pull(debtToken, amount);
        IERC20(debtToken).approve(address(pool), amount);
        pool.addQuoteToken(amount * pool.quoteTokenScale(), index, block.timestamp + 1);
    }

    /**
     *  @notice Called by lenders to remove an amount of credit at a specified price bucket.
     *  @param  pool         Address of the Ajana Pool.
     *  @param  amount       The maximum amount of quote token to be moved by a lender.
     *  @param  price        The price the bucket to which the quote tokens will be added.
     *  @dev price of uint (10**decimals) collateral token in debt token (10**decimals) with 3 decimal points for instance
     *  @dev 1WBTC = 16,990.23 USDC   translates to: 16990230
     */
    function withdrawQuote(ERC20Pool pool, uint256 amount, uint256 price) public {
        withdrawQuoteInternal(pool, amount, price);
        emit ProxyActionsOperation("AjnaWithdrawQuote");
    }

    /**
     *  @notice Called by lenders to remove an amount of credit at a specified price bucket.
     *  @param  pool         Address of the Ajana Pool.
     *  @param  amount       The maximum amount of quote token to be moved by a lender.
     *  @param  price        Price of the bucket to which the quote tokens will be added.
     *  @dev price of uint (10**decimals) collateral token in debt token (10**decimals) with 3 decimal points for instance
     *  @dev 1WBTC = 16,990.23 USDC   translates to: 16990230
     */
    function withdrawQuoteIndex(ERC20Pool pool, uint256 amount, uint256 price) public {
        uint256 index = convertPriceToIndex(price);
        address debtToken = pool.quoteTokenAddress();
        uint256 balanceBefore = IERC20(debtToken).balanceOf(address(this));
        pool.removeQuoteToken((amount * pool.quoteTokenScale()), index);
        uint256 withdrawnBalance = IERC20(debtToken).balanceOf(address(this)) - balanceBefore;
        _send(debtToken, withdrawnBalance);
    }

    /**
     *  @notice Called by lenders to move max amount of credit from a specified price bucket to another specified price bucket.
     *  @param  pool         Address of the Ajana Pool.
     *  @param  oldPrice        The price of the bucket  from which the quote tokens will be removed.
     *  @param  newPrice     The price of the bucket to which the quote tokens will be added.
     */
    function moveQuote(ERC20Pool pool, uint256 oldPrice, uint256 newPrice) public {
        moveQuoteInternal(pool, oldPrice, newPrice);
        emit ProxyActionsOperation("AjnaMoveQuote");
    }

    /**
     *  @notice Called by lenders to move an amount of credit from a specified price bucket to another specified price bucket,
     *  @notice whilst adding additional amount.
     *  @param  pool            Address of the Ajana Pool.
     *  @param  amountToAdd     The maximum amount of quote token to be moved by a lender.
     *  @param  oldPrice        The price of the bucket  from which the quote tokens will be removed.
     *  @param  newPrice        The price of the bucket to which the quote tokens will be added.
     */
    function supplyAndMoveQuote(
        ERC20Pool pool,
        uint256 amountToAdd,
        uint256 oldPrice,
        uint256 newPrice
    ) public payable {
        supplyQuoteInternal(pool, amountToAdd, newPrice);
        moveQuoteInternal(pool, oldPrice, newPrice);
        emit ProxyActionsOperation("AjnaSupplyAndMoveQuote");
    }

    /**
     *  @notice Called by lenders to move an amount of credit from a specified price bucket to another specified price bucket,
     *  @notice whilst withdrawing additional amount.
     *  @param  pool            Address of the Ajana Pool.
     *  @param  amountToWithdraw     Amount of quote token to be withdrawn by a lender.
     *  @param  oldPrice        The price of the bucket  from which the quote tokens will be removed.
     *  @param  newPrice        The price of the bucket to which the quote tokens will be added.
     */
    function withdrawAndMoveQuote(ERC20Pool pool, uint256 amountToWithdraw, uint256 oldPrice, uint256 newPrice) public {
        withdrawQuoteInternal(pool, amountToWithdraw, oldPrice);
        moveQuoteInternal(pool, oldPrice, newPrice);
        emit ProxyActionsOperation("AjnaWithdrawAndMoveQuote");
    }

    // REWARDS

    /**
     *  @notice Mints and NFT, memorizes the LPs of the user and stakes the NFT.
     *  @param  pool     Address of the Ajana Pool.
     *  @param  price    Price of the LPs to be memoriazed.
     *  @return tokenId  Id of the minted NFT
     */
    function mintAndStakeNft(ERC20Pool pool, uint256 price) public returns (uint256 tokenId) {
        tokenId = mintNft(pool);

        memorializeLiquidity(price, tokenId, pool);

        rewardsManager.stake(tokenId);
    }

    /**
     *  @notice Supplies quote token, mints and NFT, memorizes the LPs of the user and stakes the NFT.
     *  @param  pool     Address of the Ajana Pool.
     *  @param  amount   The maximum amount of quote token to be deposited by a lender.
     *  @param  price    Price of the bucket to which the quote tokens will be added.
     *  @return tokenId  Id of the minted NFT
     */
    function supplyQuoteMintNftAndStake(
        ERC20Pool pool,
        uint256 amount,
        uint256 price
    ) public payable returns (uint256 tokenId) {
        supplyQuoteInternal(pool, amount, price);

        tokenId = mintNft(pool);

        memorializeLiquidity(price, tokenId, pool);

        rewardsManager.stake(tokenId);
        emit ProxyActionsOperation("AjnaSupplyQuoteMintNftAndStake");
    }

    /**
     *  @notice Adds quote token to existing position and moves to different bucket
     *  @param  pool          Address of the Ajana Pool.
     *  @param  amountToAdd   The maximum amount of quote token to be deposited by a lender.
     *  @param  oldPrice      Index of the bucket to move from.
     *  @param  newPrice      Index of the bucket to move to.
     *  @param  tokenId       ID of the NFT to modify
     */
    function supplyAndMoveQuoteNft(
        ERC20Pool pool,
        uint256 amountToAdd,
        uint256 oldPrice,
        uint256 newPrice,
        uint256 tokenId
    ) public payable {
        rewardsManager.unstake(tokenId);

        moveLiquidity(oldPrice, newPrice, tokenId, address(pool));
        supplyQuoteInternal(pool, amountToAdd, newPrice);
        memorializeLiquidity(newPrice, tokenId, pool);

        rewardsManager.stake(tokenId);
        emit ProxyActionsOperation("AjnaSupplyAndMoveQuoteNft");
    }

    /**
     *  @notice Adds quote token to existing NFT position
     *  @param  pool          Address of the Ajana Pool.
     *  @param  amountToAdd   The maximum amount of quote token to be deposited by a lender.
     *  @param  price      Price of the bucket to move from.
     *  @param  tokenId       ID of the NFT to modify
     */
    function supplyQuoteNft(ERC20Pool pool, uint256 amountToAdd, uint256 price, uint256 tokenId) public payable {
        rewardsManager.unstake(tokenId);

        supplyQuoteInternal(pool, amountToAdd, price);
        memorializeLiquidity(price, tokenId, pool);

        rewardsManager.stake(tokenId);
        emit ProxyActionsOperation("AjnaSupplyQuoteNft");
    }

    /**
     *  @notice Withdraws quote token to existing position and moves to different bucket
     *  @param  pool          Address of the Ajana Pool.
     *  @param  amountToWithdraw   The maximum amount of quote token to be withdrawn by a lender.
     *  @param  oldPrice      Index of the bucket to move from.
     *  @param  newPrice      Index of the bucket to move to.
     *  @param  tokenId       ID of the NFT to modify
     */
    function withdrawAndMoveQuoteNft(
        ERC20Pool pool,
        uint256 amountToWithdraw,
        uint256 oldPrice,
        uint256 newPrice,
        uint256 tokenId
    ) public payable {
        rewardsManager.unstake(tokenId);

        moveLiquidity(oldPrice, newPrice, tokenId, address(pool));
        redeemPosition(newPrice, tokenId, address(pool));
        withdrawQuoteInternal(pool, amountToWithdraw, newPrice);
        memorializeLiquidity(newPrice, tokenId, pool);

        rewardsManager.stake(tokenId);
        emit ProxyActionsOperation("AjnaWithdrawAndMoveQuoteNft");
    }

    /**
     *  @notice Withdraws quote token from existing NFT position
     *  @param  pool          Address of the Ajana Pool.
     *  @param  amountToWithdraw   The maximum amount of quote token to be withdrawn by a lender.
     *  @param  price      Price of the bucket to withdraw from
     *  @param  tokenId       ID of the NFT to modify
     */
    function withdrawQuoteNft(ERC20Pool pool, uint256 amountToWithdraw, uint256 price, uint256 tokenId) public payable {
        rewardsManager.unstake(tokenId);

        redeemPosition(price, tokenId, address(pool));
        withdrawQuoteInternal(pool, amountToWithdraw, price);
        memorializeLiquidity(price, tokenId, pool);

        rewardsManager.stake(tokenId);
        emit ProxyActionsOperation("AjnaWithdrawQuoteNft");
    }

    /**
     *  @notice Called by lenders to move an amount of credit from a specified price bucket to another
     *  @notice specified price bucket using staked NFT.
     *  @param  oldPrice     Index of the bucket to move from.
     *  @param  newPrice     Index of the bucket to move to.
     *  @param  tokenId      ID of the NFT to modify
     */
    function moveQuoteNft(ERC20Pool pool, uint256 oldPrice, uint256 newPrice, uint256 tokenId) public payable {
        rewardsManager.unstake(tokenId);
        moveLiquidity(oldPrice, newPrice, tokenId, address(pool));
        rewardsManager.stake(tokenId);
        emit ProxyActionsOperation("AjnaMoveQuoteNft");
    }

    /**
     *  @notice Claim staking rewards
     *  @param  pool         Address of the Ajana Pool.
     *  @param  tokenId    TokenId to claim rewards for
     */
    function claimRewardsAndSendToOwner(ERC20Pool pool, uint256 tokenId) public {
        rewardsManager.claimRewards(tokenId, ERC20Pool(pool).currentBurnEpoch());
        ajnaToken.transfer(msg.sender, ajnaToken.balanceOf(address(this)));
    }

    /**
     *  @notice Unstakes NFT and redeems position
     *  @param  tokenId      ID of the NFT to modify
     *  @param  pool         Address of the Ajana Pool.
     *  @param  price        Price of the bucket to redeem.
     *  @param  burn         Whether to burn the NFT or not
     */
    function unstakeNftAndRedeem(uint256 tokenId, ERC20Pool pool, uint256 price, bool burn) public {
        rewardsManager.unstake(tokenId);

        redeemPosition(price, tokenId, address(pool));

        if (burn) {
            IPositionManagerOwnerActions.BurnParams memory burnParams = IPositionManagerOwnerActions.BurnParams(
                tokenId,
                address(pool)
            );

            positionManager.burn(burnParams);
            if (IAccountGuard(GUARD).canCall(address(this), ARC)) {
                IAccountGuard(GUARD).permit(ARC, address(this), false);
            }
        }
    }

    /**
     * @notice Unstakes NFT and withdraws quote token
     * @param  pool         Address of the Ajana Pool.
     * @param  price        Price of the bucket to redeem.
     * @param  tokenId      ID of the NFT to unstake
     */
    function unstakeNftAndWithdrawQuote(ERC20Pool pool, uint256 price, uint256 tokenId) public {
        unstakeNftAndRedeem(tokenId, pool, price, true);
        withdrawQuoteInternal(pool, type(uint256).max, price);
        emit ProxyActionsOperation("AjnaUnstakeNftAndWithdrawQuote");
    }

    /**
     * @notice Unstakes NFT and withdraws quote token and reclaims collateral from liquidated bucket
     * @param  pool         Address of the Ajana Pool.
     * @param  price        Price of the bucket to redeem.
     * @param  tokenId      ID of the NFT to unstake
     */
    function unstakeNftAndClaimCollateral(ERC20Pool pool, uint256 price, uint256 tokenId) public {
        unstakeNftAndRedeem(tokenId, pool, price, true);
        removeCollateralInternal(pool, price);
        emit ProxyActionsOperation("AjnaUnstakeNftAndClaimCollateral");
    }

    /**
     * @notice Reclaims collateral from liquidated bucket
     * @param  pool         Address of the Ajana Pool.
     * @param  price        Price of the bucket to redeem.
     */
    function removeCollateral(ERC20Pool pool, uint256 price) public {
        removeCollateralInternal(pool, price);
        emit ProxyActionsOperation("AjnaRemoveCollateral");
    }

    // VIEW FUNCTIONS
    /**
     * @notice  Converts price to index
     * @param   price   price of uint (10**decimals) collateral token in debt token (10**decimals) with 18 decimal points for instance
     * @return index   index of the bucket
     * @dev     price of uint (10**decimals) collateral token in debt token (10**decimals) with 18 decimal points for instance
     * @dev     1WBTC = 16,990.23 USDC   translates to: 16990230000000000000000
     */
    function convertPriceToIndex(uint256 price) public view returns (uint256) {
        return poolInfoUtils.priceToIndex(price);
    }

    /**
     *  @notice Get the amount of quote token deposited to a specific bucket
     *  @param  pool         Address of the Ajana Pool.
     *  @param  price        Price of the bucket to query
     *  @return  quoteAmount Amount of quote token deposited to dpecific bucket
     *  @dev price of uint (10**decimals) collateral token in debt token (10**decimals) with 18 decimal points for instance
     *  @dev     1WBTC = 16,990.23 USDC   translates to: 16990230000000000000000
     */
    function getQuoteAmount(ERC20Pool pool, uint256 price) public view returns (uint256 quoteAmount) {
        uint256 index = convertPriceToIndex(price);

        (uint256 lpCount, ) = pool.lenderInfo(index, address(this));
        quoteAmount = poolInfoUtils.lpToQuoteTokens(address(pool), lpCount, index);
    }
}
