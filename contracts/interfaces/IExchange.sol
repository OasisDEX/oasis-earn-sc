// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.1;

abstract contract IExchange {
  function swapDaiForToken(
    address asset,
    uint256 amount,
    uint256 receiveAtLeast,
    address callee,
    bytes calldata withData
  ) external virtual;

  function swapTokenForDai(
    address asset,
    uint256 amount,
    uint256 receiveAtLeast,
    address callee,
    bytes calldata withData
  ) external virtual;

  function swapTokenForToken(
    address assetFrom,
    address assetTo,
    uint256 amount,
    uint256 receiveAtLeast
  ) external virtual;
}
