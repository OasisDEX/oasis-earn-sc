pragma solidity ^0.8.1;

struct AAVEDepositData {
  address asset;
  uint256 amount;
}

struct AAVEBorrowData {
  address asset;
  uint256 amount;
}

struct AAVEWithdrawData {
  address asset;
  uint256 amount;
}
