pragma solidity ^0.8.1;

struct DepositData {
  address joinAddress;
  address mcdManager;
  uint256 vaultId;
  uint256 amount;
}

struct WithdrawData {
  uint256 vaultId;
  address userAddress;
  address joinAddr;
  address mcdManager;
  uint256 amount;
}

struct GenerateData {
  address to;
  address mcdManager;
  uint256 vaultId;
  uint256 amount;
}

struct PaybackData {
  uint256 vaultId;
  address userAddress;
  address daiJoin;
  address mcdManager;
  uint256 amount;
  bool paybackAll;
}

struct OpenVaultData {
  address joinAddress;
  address mcdManager;
}

struct FlashloanData {
  uint256 amount;
  address borrower;
  Call[] calls;
}

struct PullTokenData {
  address asset;
  address from;
  uint256 amount;
}

struct SendTokenData {
  address asset;
  address to;
  uint256 amount;
}

struct SetApprovalData {
  address asset;
  address delegator;
  uint256 amount;
}

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

struct SwapData {
  address fromAsset;
  address toAsset;
  uint256 amount;
  uint256 receiveAtLeast;
  bytes withData;
}

struct Call {
  bytes32 targetHash; //TODO: Figure out a better name
  bytes callData;
}
