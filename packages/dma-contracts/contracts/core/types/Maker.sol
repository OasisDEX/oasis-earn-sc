// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { IJoin } from "../../interfaces/maker/IJoin.sol";
import { IManager } from "../../interfaces/maker/IManager.sol";

struct DepositData {
  IJoin joinAddress;
  uint256 vaultId;
  uint256 amount;
}

struct WithdrawData {
  uint256 vaultId;
  address userAddress;
  IJoin joinAddr;
  uint256 amount;
}

struct GenerateData {
  address to;
  uint256 vaultId;
  uint256 amount;
}

struct PaybackData {
  uint256 vaultId;
  address userAddress;
  uint256 amount;
  bool paybackAll;
}

struct OpenVaultData {
  IJoin joinAddress;
}

struct CdpAllowData {
  uint256 vaultId;
  address userAddress;
}

struct GiveData {
  uint256 vaultId;
  address to;
}
