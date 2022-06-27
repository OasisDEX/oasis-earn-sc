// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

abstract contract IGUNIRouter {
  function addLiquidity(
    address _pool,
    uint256 _amount0Max,
    uint256 _amount1Max,
    uint256 _amount0Min,
    uint256 _amount1Min,
    address _receiver
  )
    public
    virtual
    returns (
      uint256 amount0,
      uint256 amount1,
      uint256 mintAmount
    );

  function removeLiquidity(
    address _pool,
    uint256 _burnAmount,
    uint256 _amount0Min,
    uint256 _amount1Min,
    address _receiver
  )
    public
    virtual
    returns (
      uint256 amount0,
      uint256 amount1,
      uint256 liquidityBurned
    );
}
