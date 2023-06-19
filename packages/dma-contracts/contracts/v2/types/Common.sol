// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { FlashloanProvider } from "../../core/types/Common.sol";

struct CallV2 {
  bytes32 targetHash;
  bytes callData;
}

struct FlashloanDataV2 {
  uint256 amount;
  address asset;
  bool isDPMProxy;
  FlashloanProvider provider;
  CallV2[] calls;
}
