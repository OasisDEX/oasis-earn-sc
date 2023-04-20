// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./IAjnaPool.sol";
import "./ajna/PoolInfoUtils.sol";

contract AjnaPoc is Ownable {
    address collateralToken;
    address debtToken;
    address pool;
    PoolInfoUtils poolInfoUtils;

    constructor(address _collateral, address _token, address _pool) {
        collateralToken = _collateral;
        debtToken = _token;
        pool = _pool;
        poolInfoUtils = new PoolInfoUtils();
    }

    function drawTokens(address token, uint256 amount) public onlyOwner {
        IERC20(token).transfer(msg.sender, amount);
    }

    function depositCollateral(uint256 amount, uint256 maxIndex) public onlyOwner {
        IERC20(collateralToken).approve(pool, amount);
        require(IERC20(collateralToken).balanceOf(address(this)) >= amount, "anja-poc: collateral balance too low");
        IAjnaPool(pool).drawDebt(address(this), 0, maxIndex, amount);
    }

    function withdrawCollateral(uint256 amount) public onlyOwner {
        IAjnaPool(pool).repayDebt(address(this), 0, amount);
    }

    function drawDebt(uint256 amount) public onlyOwner {
        IAjnaPool(pool).drawDebt(address(this), amount, type(uint256).max, 0);
    }

    function repayDebt(uint256 amount) public onlyOwner {
        IERC20(collateralToken).approve(pool, amount);
        IAjnaPool(pool).drawDebt(address(this), amount, type(uint256).max, 0);
    }

    //price - price of uint (10**decimals) collateral token in debt token (10**decimals) with 3 decimal points for instance
    // 1WBTC = 16,990.23 USDC   translates to: 16990230
    function supplyQuote(uint256 amount, uint256 price) public onlyOwner {
        IERC20(debtToken).approve(pool, amount);
        uint256 index_ = convertPriceToIndex(price);
        IAjnaPool(pool).addQuoteToken(amount, index_);
    }

    //price - price of uint (10**decimals) collateral token in debt token (10**decimals) with 3 decimal points for instance
    // 1WBTC = 16,990.23 USDC   translates to: 16990230
    function withdrawQuote(uint256 amount, uint256 price) public onlyOwner {
        uint256 index_ = convertPriceToIndex(price);
        IAjnaPool(pool).removeQuoteToken(amount, index_);
    }

    function moveQuote(uint256 amount, uint256 price, uint256 newPrice) public onlyOwner {
        withdrawQuote(amount, price);
        supplyQuote(amount, newPrice);
    }

    function openAndDraw(uint256 debtAmount, uint256 collateralAmount, uint256 maxIndex) public onlyOwner {
        IERC20(collateralToken).approve(pool, collateralAmount);
        IAjnaPool(pool).drawDebt(address(this), debtAmount, maxIndex, collateralAmount);
    }

    //price - price of uint (10**decimals) collateral token in debt token (10**decimals) with 3 decimal points for instance
    // 1WBTC = 16,990.23 USDC   translates to: 16990230
    function convertPriceToIndex(uint256 price) public view returns (uint256) {
        price = price * 10 ** 15;
        return poolInfoUtils.priceToIndex(price);
    }
}
