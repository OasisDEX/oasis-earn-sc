pragma solidity ^0.8.1;

import { IJoin } from "../../interfaces/maker/IJoin.sol";
import { IManager } from "../../interfaces/maker/IManager.sol";

struct DepositData {
  IJoin joinAddress;
  IManager mcdManager;
  uint256 vaultId;
  uint256 amount;
}

struct WithdrawData {
  uint256 vaultId;
  address userAddress;
  IJoin joinAddr;
  IManager mcdManager;
  uint256 amount;
}

struct GenerateData {
  address to;
  IManager mcdManager;
  uint256 vaultId;
  uint256 amount;
}

struct PaybackData {
  uint256 vaultId;
  address userAddress;
  IJoin daiJoin;
  IManager mcdManager;
  uint256 amount;
  bool paybackAll;
}

struct OpenVaultData {
  IJoin joinAddress;
  IManager mcdManager;
}
