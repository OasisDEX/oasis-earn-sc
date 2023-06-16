// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import { IAjnaPoolUtilsInfo } from "../../interfaces/ajna/IAjnaPoolUtilsInfo.sol";
import { IERC20Pool } from "../interfaces/pool/erc20/IERC20Pool.sol";
import { IPositionManager } from "../interfaces/position/IPositionManager.sol";
import { IRewardsManager } from "../interfaces/rewards/IRewardsManager.sol";

import { IAccountGuard } from "../../interfaces/dpm/IAccountGuard.sol";

import { IWETH } from "../../interfaces/tokens/IWETH.sol";

interface IAjnaProxyActions {
    function positionManager() external view returns (IPositionManager);

    function rewardsManager() external view returns (IRewardsManager);

    function ARC() external view returns (address);
}

contract AjnaProxyActions is IAjnaProxyActions {
    IAjnaPoolUtilsInfo public immutable poolInfoUtils;
    IERC20 public immutable ajnaToken;
    address public immutable WETH;
    address public immutable GUARD;
    address public immutable deployer;
    IAjnaProxyActions public immutable self;
    IPositionManager public positionManager;
    IRewardsManager public rewardsManager;
    address public ARC;

    constructor(IAjnaPoolUtilsInfo _poolInfoUtils, IERC20 _ajnaToken, address _WETH, address _GUARD) {
        poolInfoUtils = _poolInfoUtils;
        ajnaToken = _ajnaToken;
        WETH = _WETH;
        GUARD = _GUARD;
        self = this;
        deployer = msg.sender;
    }

    function initialize(address _positionManager, address _rewardsManager, address _ARC) external {
        require(msg.sender == deployer, "apa/not-deployer");
        require(
            address(positionManager) == address(0) && address(rewardsManager) == address(0) && ARC == address(0),
            "apa/already-initialized"
        );
        positionManager = IPositionManager(_positionManager);
        rewardsManager = IRewardsManager(_rewardsManager);
        ARC = _ARC;
    }

    /**
     * @dev Emitted once an Operation has completed execution
     * @param name Name of the operation
     **/
    event ProxyActionsOperation(bytes32 indexed name);

    /**
     * @dev Emitted when a new position is created
     * @param proxyAddress The address of the newly created position proxy contract
     * @param protocol The name of the protocol associated with the position
     * @param positionType The type of position being created (e.g. borrow or earn)
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
    function mintNft(IERC20Pool pool) internal returns (uint256 tokenId) {
        address _ARC = self.ARC();
        tokenId = self.positionManager().mint(address(pool), address(this), keccak256("ERC20_NON_SUBSET_HASH"));
        if (!IAccountGuard(GUARD).canCall(address(this), _ARC)) {
            IAccountGuard(GUARD).permit(_ARC, address(this), true);
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
        address[] memory addresses = new address[](1);
        addresses[0] = address(self.positionManager());
        IERC20Pool(pool).approveLPTransferors(addresses);
        self.positionManager().redeemPositions(address(pool), tokenId, indexes);
    }

    /**
     *  @notice Memorialize bucket in NFT
     *  @param  price         Price of the momorialized bucket
     *  @param  tokenId       Nft ID
     */
    function memorializeLiquidity(uint256 price, uint256 tokenId, IERC20Pool pool) internal {
        uint256 index = convertPriceToIndex(price);

        (uint256 lpCount, ) = IERC20Pool(pool).lenderInfo(index, address(this));
        uint256[] memory indexes = new uint256[](1);
        indexes[0] = index;
        uint256[] memory lpCounts = new uint256[](1);
        lpCounts[0] = lpCount;
        IERC20Pool(pool).increaseLPAllowance(address(self.positionManager()), indexes, lpCounts);
        self.positionManager().memorializePositions(address(pool), tokenId, indexes);
        IERC721(address(self.positionManager())).approve(address(self.rewardsManager()), tokenId);
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

        self.positionManager().moveLiquidity(pool, tokenId, oldIndex, newIndex, block.timestamp + 1);
        IERC721(address(self.positionManager())).approve(address(self.rewardsManager()), tokenId);
    }

    /**
     *  @notice Called internally to add an amount of credit at a specified price bucket.
     *  @param  pool         Address of the Ajana Pool.
     *  @param  amount       The maximum amount of quote token to be moved by a lender.
     *  @param  price        The price the bucket to which the quote tokens will be added.
     *  @dev price of uint (10**decimals) collateral token in debt token (10**decimals) with 3 decimal points for instance
     *  @dev 1WBTC = 16,990.23 USDC   translates to: 16990230
     */
    function supplyQuoteInternal(IERC20Pool pool, uint256 amount, uint256 price) internal {
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
    function moveQuoteInternal(IERC20Pool pool, uint256 oldPrice, uint256 newPrice) internal {
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
    function withdrawQuoteInternal(IERC20Pool pool, uint256 amount, uint256 price) internal {
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
    function removeCollateralInternal(IERC20Pool pool, uint256 price) internal {
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
    function depositCollateral(IERC20Pool pool, uint256 collateralAmount, uint256 price) public payable {
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
    function withdrawCollateral(IERC20Pool pool, uint256 amount) public {
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
    function drawDebt(IERC20Pool pool, uint256 debtAmount, uint256 price) public {
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
    function repayDebt(IERC20Pool pool, uint256 amount) public payable {
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
        IERC20Pool pool,
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
    function openPosition(IERC20Pool pool, uint256 debtAmount, uint256 collateralAmount, uint256 price) public payable {
        depositAndDraw(pool, debtAmount, collateralAmount, price);
        emit CreatePosition(address(this), "Ajna", "Borrow", pool.collateralAddress(), pool.quoteTokenAddress());
    }

    /**
     *  @notice Open Earn position for msg.sender
     *  @param  pool           Pool address
     *  @param  depositAmount     Amount of debt to borrow
     *  @param  price          Price of the bucket
     */
    function openEarnPosition(IERC20Pool pool, uint256 depositAmount, uint256 price) public payable {
        supplyQuoteInternal(pool, depositAmount, price);
        emit ProxyActionsOperation("AjnaSupplyQuote");
        emit CreatePosition(address(this), "Ajna", "Earn", pool.collateralAddress(), pool.quoteTokenAddress());
    }

    /**
     *  @notice Open Earn (with NFT) position for msg.sender
     *  @param  pool           Pool address
     *  @param  depositAmount     Amount of debt to borrow
     *  @param  price          Price of the bucket
     */
    function openEarnPositionNft(IERC20Pool pool, uint256 depositAmount, uint256 price) public payable {
        supplyQuoteMintNftAndStake(pool, depositAmount, price);
        emit CreatePosition(address(this), "Ajna", "Earn", pool.collateralAddress(), pool.quoteTokenAddress());
    }

    /**
     *  @notice Repay debt and withdraw collateral for msg.sender
     *  @param  pool           Pool address
     *  @param  debtAmount     Amount of debt to repay
     *  @param  collateralAmount Amount of collateral to withdraw
     */
    function repayWithdraw(IERC20Pool pool, uint256 debtAmount, uint256 collateralAmount) public {
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
    function repayAndClose(IERC20Pool pool) public payable {
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
    function supplyQuote(IERC20Pool pool, uint256 amount, uint256 price) public payable {
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
    function supplyQuoteIndex(IERC20Pool pool, uint256 amount, uint256 index) public payable {
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
    function withdrawQuote(IERC20Pool pool, uint256 amount, uint256 price) public {
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
    function withdrawQuoteIndex(IERC20Pool pool, uint256 amount, uint256 price) public {
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
    function moveQuote(IERC20Pool pool, uint256 oldPrice, uint256 newPrice) public {
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
        IERC20Pool pool,
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
    function withdrawAndMoveQuote(
        IERC20Pool pool,
        uint256 amountToWithdraw,
        uint256 oldPrice,
        uint256 newPrice
    ) public {
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
    function mintAndStakeNft(IERC20Pool pool, uint256 price) public returns (uint256 tokenId) {
        tokenId = mintNft(pool);

        memorializeLiquidity(price, tokenId, pool);

        self.rewardsManager().stake(tokenId);
    }

    /**
     *  @notice Supplies quote token, mints and NFT, memorizes the LPs of the user and stakes the NFT.
     *  @param  pool     Address of the Ajana Pool.
     *  @param  amount   The maximum amount of quote token to be deposited by a lender.
     *  @param  price    Price of the bucket to which the quote tokens will be added.
     *  @return tokenId  Id of the minted NFT
     */
    function supplyQuoteMintNftAndStake(
        IERC20Pool pool,
        uint256 amount,
        uint256 price
    ) public payable returns (uint256 tokenId) {
        supplyQuoteInternal(pool, amount, price);

        tokenId = mintNft(pool);

        memorializeLiquidity(price, tokenId, pool);

        self.rewardsManager().stake(tokenId);
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
        IERC20Pool pool,
        uint256 amountToAdd,
        uint256 oldPrice,
        uint256 newPrice,
        uint256 tokenId
    ) public payable {
        self.rewardsManager().unstake(tokenId);

        moveLiquidity(oldPrice, newPrice, tokenId, address(pool));
        supplyQuoteInternal(pool, amountToAdd, newPrice);
        memorializeLiquidity(newPrice, tokenId, pool);

        self.rewardsManager().stake(tokenId);
        emit ProxyActionsOperation("AjnaSupplyAndMoveQuoteNft");
    }

    /**
     *  @notice Adds quote token to existing NFT position
     *  @param  pool          Address of the Ajana Pool.
     *  @param  amountToAdd   The maximum amount of quote token to be deposited by a lender.
     *  @param  price      Price of the bucket to move from.
     *  @param  tokenId       ID of the NFT to modify
     */
    function supplyQuoteNft(IERC20Pool pool, uint256 amountToAdd, uint256 price, uint256 tokenId) public payable {
        self.rewardsManager().unstake(tokenId);

        supplyQuoteInternal(pool, amountToAdd, price);
        memorializeLiquidity(price, tokenId, pool);

        self.rewardsManager().stake(tokenId);
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
        IERC20Pool pool,
        uint256 amountToWithdraw,
        uint256 oldPrice,
        uint256 newPrice,
        uint256 tokenId
    ) public payable {
        self.rewardsManager().unstake(tokenId);

        moveLiquidity(oldPrice, newPrice, tokenId, address(pool));
        redeemPosition(newPrice, tokenId, address(pool));
        withdrawQuoteInternal(pool, amountToWithdraw, newPrice);
        memorializeLiquidity(newPrice, tokenId, pool);

        self.rewardsManager().stake(tokenId);
        emit ProxyActionsOperation("AjnaWithdrawAndMoveQuoteNft");
    }

    /**
     *  @notice Withdraws quote token from existing NFT position
     *  @param  pool          Address of the Ajana Pool.
     *  @param  amountToWithdraw   The maximum amount of quote token to be withdrawn by a lender.
     *  @param  price      Price of the bucket to withdraw from
     *  @param  tokenId       ID of the NFT to modify
     */
    function withdrawQuoteNft(
        IERC20Pool pool,
        uint256 amountToWithdraw,
        uint256 price,
        uint256 tokenId
    ) public payable {
        self.rewardsManager().unstake(tokenId);

        redeemPosition(price, tokenId, address(pool));
        withdrawQuoteInternal(pool, amountToWithdraw, price);
        memorializeLiquidity(price, tokenId, pool);

        self.rewardsManager().stake(tokenId);
        emit ProxyActionsOperation("AjnaWithdrawQuoteNft");
    }

    /**
     *  @notice Called by lenders to move an amount of credit from a specified price bucket to another
     *  @notice specified price bucket using staked NFT.
     *  @param  oldPrice     Index of the bucket to move from.
     *  @param  newPrice     Index of the bucket to move to.
     *  @param  tokenId      ID of the NFT to modify
     */
    function moveQuoteNft(IERC20Pool pool, uint256 oldPrice, uint256 newPrice, uint256 tokenId) public payable {
        self.rewardsManager().unstake(tokenId);
        moveLiquidity(oldPrice, newPrice, tokenId, address(pool));
        self.rewardsManager().stake(tokenId);
        emit ProxyActionsOperation("AjnaMoveQuoteNft");
    }

    /**
     *  @notice Claim staking rewards
     *  @param  pool         Address of the Ajana Pool.
     *  @param  tokenId    TokenId to claim rewards for
     */
    function claimRewardsAndSendToOwner(IERC20Pool pool, uint256 tokenId) public {
        uint256 currentEpoch = IERC20Pool(pool).currentBurnEpoch();
        uint256 minAmount = self.rewardsManager().calculateRewards(tokenId, currentEpoch);
        self.rewardsManager().claimRewards(tokenId, currentEpoch, minAmount);
        ajnaToken.transfer(msg.sender, ajnaToken.balanceOf(address(this)));
    }

    /**
     *  @notice Unstakes NFT and redeems position
     *  @param  tokenId      ID of the NFT to modify
     *  @param  pool         Address of the Ajana Pool.
     *  @param  price        Price of the bucket to redeem.
     *  @param  burn         Whether to burn the NFT or not
     */
    function unstakeNftAndRedeem(uint256 tokenId, IERC20Pool pool, uint256 price, bool burn) public {
        address _ARC = self.ARC();
        self.rewardsManager().unstake(tokenId);

        redeemPosition(price, tokenId, address(pool));

        if (burn) {
            self.positionManager().burn(address(pool), tokenId);
            if (IAccountGuard(GUARD).canCall(address(this), _ARC)) {
                IAccountGuard(GUARD).permit(_ARC, address(this), false);
            }
        }
    }

    /**
     * @notice Unstakes NFT and withdraws quote token
     * @param  pool         Address of the Ajana Pool.
     * @param  price        Price of the bucket to redeem.
     * @param  tokenId      ID of the NFT to unstake
     */
    function unstakeNftAndWithdrawQuote(IERC20Pool pool, uint256 price, uint256 tokenId) public {
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
    function unstakeNftAndClaimCollateral(IERC20Pool pool, uint256 price, uint256 tokenId) public {
        unstakeNftAndRedeem(tokenId, pool, price, true);
        removeCollateralInternal(pool, price);
        emit ProxyActionsOperation("AjnaUnstakeNftAndClaimCollateral");
    }

    /**
     * @notice Reclaims collateral from liquidated bucket
     * @param  pool         Address of the Ajana Pool.
     * @param  price        Price of the bucket to redeem.
     */
    function removeCollateral(IERC20Pool pool, uint256 price) public {
        removeCollateralInternal(pool, price);
        emit ProxyActionsOperation("AjnaRemoveCollateral");
    }

    // OPT IN AND OUT

    /**
     *  @notice Mints and NFT, memorizes the LPs of the user and stakes the NFT.
     *  @param  pool     Address of the Ajana Pool.
     *  @param  price    Price of the LPs to be memoriazed.
     *  @return tokenId  Id of the minted NFT
     */
    function optInStaking(IERC20Pool pool, uint256 price) public returns (uint256 tokenId) {
        tokenId = mintAndStakeNft(pool, price);
        emit ProxyActionsOperation("AjnaOptInStaking");
    }

    /**
     * @notice Unstakes the NFT, burns it and redeems invested LP tokens, memorized by the user.
     * @param pool Address of the Ajana Pool.
     * @param tokenId Id of the NFT to unstake and burn.
     * @param price Price of the LPs to be redeemed.
     * @dev This function unstakes the NFT which was previously staked and also calls "unstakeNftAndRedeem" to redeem invested LP tokens.
     */
    function optOutStaking(IERC20Pool pool, uint256 tokenId, uint256 price) public {
        unstakeNftAndRedeem(tokenId, pool, price, true);
        emit ProxyActionsOperation("AjnaOptOutStaking");
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
    function getQuoteAmount(IERC20Pool pool, uint256 price) public view returns (uint256 quoteAmount) {
        uint256 index = convertPriceToIndex(price);

        (uint256 lpCount, ) = pool.lenderInfo(index, address(this));
        quoteAmount = poolInfoUtils.lpToQuoteTokens(address(pool), lpCount, index);
    }
}
