// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

import { MathLib } from "./MathLib.sol";

/** DISCLAIMER: This file has been striped down to the minimum needed for Morpho actions */

/// @title SharesMathLib
/// @author Morpho Labs
/// @custom:contact security@morpho.org
/// @notice Shares management library.
/// @dev This implementation mitigates share price manipulations, using OpenZeppelin's method of virtual shares:
/// https://docs.openzeppelin.com/contracts/4.x/erc4626#inflation-attack.
library SharesMathLib {
  using MathLib for uint256;

  /// @dev The number of virtual shares has been chosen low enough to prevent overflows, and high enough to ensure
  /// high precision computations.
  uint256 internal constant VIRTUAL_SHARES = 1e6;

  /// @dev A number of virtual assets of 1 enforces a conversion rate between shares and assets when a market is
  /// empty.
  uint256 internal constant VIRTUAL_ASSETS = 1;

  /// @dev Calculates the value of `shares` quoted in assets, rounding up.
  function toAssetsUp(
    uint256 shares,
    uint256 totalAssets,
    uint256 totalShares
  ) internal pure returns (uint256) {
    return shares.mulDivUp(totalAssets + VIRTUAL_ASSETS, totalShares + VIRTUAL_SHARES);
  }
}
