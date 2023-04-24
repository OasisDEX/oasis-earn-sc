// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

struct DepositBorrowData {
  address pool;
  uint256 depositAmount;
  uint256 borrowAmount;
  uint256 price;
}

struct RepayWithdrawData {
  address pool;
  uint256 withdrawAmount;
  uint256 repayAmount;
  uint256 price;
}