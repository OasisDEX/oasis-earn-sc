// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

struct DepositBorrowData {
  address quoteToken;
  address collateralToken;
  uint256 depositAmount;
  uint256 borrowAmount;
  bool sumDepositAmounts;
  uint256 price;
}

struct RepayWithdrawData {
  address quoteToken;
  address collateralToken;
  uint256 withdrawAmount;
  uint256 repayAmount;
  bool paybackAll;
  bool withdrawAll;
  uint256 price;
}
