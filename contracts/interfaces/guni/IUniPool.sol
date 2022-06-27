// SPDX-License-Identifier: MIT

pragma solidity ^0.8.1;

abstract contract IUniPool {
  function slot0()
    public
    view
    virtual
    returns (
      uint160,
      int24,
      uint16,
      uint16,
      uint16,
      uint8,
      bool
    );

  function swap(
    address,
    bool,
    int256,
    uint160,
    bytes calldata
  ) public view virtual;

  function positions(bytes32)
    public
    view
    virtual
    returns (
      uint128,
      uint256,
      uint256,
      uint128,
      uint128
    );
}
