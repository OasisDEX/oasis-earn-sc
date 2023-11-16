// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.15;

import { Context } from "@openzeppelin/contracts/utils/Context.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { PriceUtils } from "../libs/PriceUtils.sol";
import { PercentageUtils } from "../libs/PercentageUtils.sol";
import { IMockExchange } from "./IMockExchange.sol";

interface IFlashLoanRecipient {
  /**
   * @dev When `flashLoan` is called on the Vault, it invokes the `receiveFlashLoan` hook on the recipient.
   *
   * At the time of the call, the Vault will have transferred `amounts` for `tokens` to the recipient. Before this
   * call returns, the recipient must have transferred `amounts` plus `feeAmounts` for each token back to the
   * Vault, or else the entire flash loan will revert.
   *
   * `userData` is the same value passed in the `IVault.flashLoan` call.
   */
  function receiveFlashLoan(
    IERC20[] memory tokens,
    uint256[] memory amounts,
    uint256[] memory feeAmounts,
    bytes memory userData
  ) external;
}

contract MockExchange is IMockExchange, Context {
  using SafeERC20 for IERC20;

  // STORAGE
  mapping(address => uint256) public prices;
  uint256 public fee = 2 * PercentageUtils.PERCENTAGE_FACTOR;
  address public feeBeneficiaryAddress;

  // CONSTRUCTOR
  constructor(address feeBeneficiaryAddress_) {
    feeBeneficiaryAddress = feeBeneficiaryAddress_;
  }

  // MUTATING FUNCTIONS
  function setPrice(address token, uint256 p) public {
    prices[token] = p;
  }

  function setFee(uint256 fee_) public {
    fee = fee_;
  }

  function swap(
    address assetFrom,
    address assetTo,
    uint256 amountIn,
    bool feeOnTransfer
  ) public returns (uint256 amountOut, uint256 feeAmount) {
    (amountOut, feeAmount) = calculateOutputAmount(assetFrom, assetTo, amountIn, feeOnTransfer);

    IERC20(assetFrom).safeTransferFrom(_msgSender(), address(this), amountIn);

    if (feeOnTransfer && feeAmount > 0) {
      _collectFee(assetTo, feeAmount);
    }

    IERC20(assetTo).safeTransfer(_msgSender(), amountOut);

    emit AssetSwap(assetFrom, assetTo, amountIn, amountOut);
  }

  function flashLoan(
    IFlashLoanRecipient recipient,
    IERC20[] memory tokens,
    uint256[] memory amounts,
    bytes memory userData
  ) external {
    require(tokens.length == amounts.length, "Invalid input length");

    uint256[] memory feeAmounts = new uint256[](tokens.length);
    uint256[] memory preLoanBalances = new uint256[](tokens.length);

    // Used to ensure `tokens` is sorted in ascending order, which ensures token uniqueness.
    IERC20 previousToken = IERC20(address(0));

    for (uint256 i = 0; i < tokens.length; ++i) {
      IERC20 token = tokens[i];
      uint256 amount = amounts[i];

      require(
        token > previousToken,
        token == IERC20(address(0)) ? "Zero token" : "Unsorted tokens"
      );
      previousToken = token;

      preLoanBalances[i] = token.balanceOf(address(this));
      feeAmounts[i] = 0;

      require(preLoanBalances[i] >= amount, "Insufficient flashloan balance");
      token.safeTransfer(address(recipient), amount);
    }

    recipient.receiveFlashLoan(tokens, amounts, feeAmounts, userData);

    for (uint256 i = 0; i < tokens.length; ++i) {
      IERC20 token = tokens[i];
      uint256 preLoanBalance = preLoanBalances[i];

      // Checking for loan repayment first (without accounting for fees) makes for simpler debugging, and results
      // in more accurate revert reasons if the flash loan protocol fee percentage is zero.
      uint256 postLoanBalance = token.balanceOf(address(this));
      require(postLoanBalance >= preLoanBalance, "Invalid post loan balance");

      // No need for checked arithmetic since we know the loan was fully repaid.
      uint256 receivedFeeAmount = postLoanBalance - preLoanBalance;
      require(receivedFeeAmount >= feeAmounts[i], "Insufficient flash loan fee amount");
    }
  }

  // VIEW FUNCTIONS
  function calculateOutputAmount(
    address assetFrom,
    address assetTo,
    uint256 amount,
    bool feeOnTransfer
  ) public view returns (uint256 finalAmountOut, uint256 feeAmount) {
    uint8 assetFromDecimals = _getTokenDecimals(assetFrom);
    uint8 assetToDecimals = _getTokenDecimals(assetTo);

    uint256 assetToPrice = prices[assetTo];
    uint256 assetFromPrice = prices[assetFrom];

    finalAmountOut = PriceUtils.convertAmount(
      assetFromDecimals,
      assetToDecimals,
      amount,
      assetFromPrice,
      assetToPrice
    );

    if (feeOnTransfer) {
      feeAmount = _calculateFee(finalAmountOut);
      finalAmountOut = finalAmountOut - feeAmount;
    }
  }

  // INTERNALS
  function _calculateFee(uint256 amount) internal view returns (uint256 feeAmount) {
    feeAmount = PercentageUtils.applyPercentage(amount, fee);
  }

  function _collectFee(address asset, uint256 feeAmount) internal {
    IERC20(asset).safeTransfer(feeBeneficiaryAddress, feeAmount);

    emit FeePaid(feeBeneficiaryAddress, feeAmount);
  }

  function _getTokenDecimals(address asset) internal view returns (uint8) {
    return IERC20Metadata(asset).decimals();
  }
}
