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
