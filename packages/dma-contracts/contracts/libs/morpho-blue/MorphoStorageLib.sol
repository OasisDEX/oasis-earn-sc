// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

import { Id } from "../../interfaces/morpho-blue/IMorpho.sol";

/** DISCLAIMER: This file has been striped down to the minimum needed for Morpho actions */

/// @title MorphoStorageLib
/// @author Morpho Labs
/// @custom:contact security@morpho.org
/// @notice Helper library exposing getters to access Morpho storage variables' slot.
/// @dev This library is not used in Morpho itself and is intended to be used by integrators.
library MorphoStorageLib {
  /* SLOTS */

  uint256 internal constant POSITION_SLOT = 2;
  uint256 internal constant MARKET_SLOT = 3;

  /* SLOT OFFSETS */

  uint256 internal constant BORROW_SHARES_AND_COLLATERAL_OFFSET = 1;

  uint256 internal constant TOTAL_BORROW_ASSETS_AND_SHARES_OFFSET = 1;

  /* GETTERS */

  function positionBorrowSharesAndCollateralSlot(
    Id id,
    address user
  ) internal pure returns (bytes32) {
    return
      bytes32(
        uint256(keccak256(abi.encode(user, keccak256(abi.encode(id, POSITION_SLOT))))) +
          BORROW_SHARES_AND_COLLATERAL_OFFSET
      );
  }

  function marketTotalBorrowAssetsAndSharesSlot(Id id) internal pure returns (bytes32) {
    return
      bytes32(
        uint256(keccak256(abi.encode(id, MARKET_SLOT))) + TOTAL_BORROW_ASSETS_AND_SHARES_OFFSET
      );
  }
}
