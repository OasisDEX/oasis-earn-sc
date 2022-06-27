// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

abstract contract IGUNIResolver {
  function getRebalanceParams(
    address pool,
    uint256 amount0In,
    uint256 amount1In,
    uint256 price18Decimals
  ) external view virtual returns (bool zeroForOne, uint256 swapAmount);
}
