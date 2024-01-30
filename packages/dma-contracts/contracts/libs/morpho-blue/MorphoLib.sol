// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

import { IMorpho, Id } from "../../interfaces/morpho-blue/IMorpho.sol";
import { MorphoStorageLib } from "./MorphoStorageLib.sol";

/** DISCLAIMER: This file has been striped down to the minimum needed for Morpho actions */

/// @title MorphoLib
/// @author Morpho Labs
/// @custom:contact security@morpho.org
/// @notice Helper library to access Morpho storage variables.
library MorphoLib {
  function borrowShares(IMorpho morpho, Id id, address user) internal view returns (uint256) {
    bytes32[] memory slot = _array(
      MorphoStorageLib.positionBorrowSharesAndCollateralSlot(id, user)
    );
    return uint128(uint256(morpho.extSloads(slot)[0]));
  }

  function totalBorrowAssets(IMorpho morpho, Id id) internal view returns (uint256) {
    bytes32[] memory slot = _array(MorphoStorageLib.marketTotalBorrowAssetsAndSharesSlot(id));
    return uint128(uint256(morpho.extSloads(slot)[0]));
  }

  function totalBorrowShares(IMorpho morpho, Id id) internal view returns (uint256) {
    bytes32[] memory slot = _array(MorphoStorageLib.marketTotalBorrowAssetsAndSharesSlot(id));
    return uint256(morpho.extSloads(slot)[0] >> 128);
  }

  function _array(bytes32 x) private pure returns (bytes32[] memory) {
    bytes32[] memory res = new bytes32[](1);
    res[0] = x;
    return res;
  }
}
