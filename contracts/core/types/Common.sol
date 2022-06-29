pragma solidity ^0.8.1;

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

struct Operation {
  uint8 currentAction;
  bytes32[] actions;
}
