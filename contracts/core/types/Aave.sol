pragma solidity ^0.8.1;

struct DepositData {
  address asset;
  uint256 amount;
}

struct BorrowData {
  address asset;
  uint256 amount;
}

struct WithdrawData {
  address asset;
  uint256 amount;
}

struct PaybackData {
  address asset;
  uint256 amount;
}
