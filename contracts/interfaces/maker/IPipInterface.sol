// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

abstract contract IPipInterface {
  function read() public virtual returns (bytes32);
}
