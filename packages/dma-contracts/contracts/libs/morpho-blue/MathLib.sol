// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

/** DISCLAIMER: This file has been striped down to the minimum needed for Morpho actions */

/// @title MathLib
/// @author Morpho Labs
/// @custom:contact security@morpho.org
/// @notice Library to manage fixed-point arithmetic.
library MathLib {
  /// @dev (x * y) / d rounded up.
  function mulDivUp(uint256 x, uint256 y, uint256 d) internal pure returns (uint256) {
    return (x * y + (d - 1)) / d;
  }
}
