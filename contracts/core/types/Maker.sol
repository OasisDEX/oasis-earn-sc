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

struct OpenVaultData {
    address joinAddress;
    address mcdManager;
}
