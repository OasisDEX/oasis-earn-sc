// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

abstract contract IGem {
  function approve(address, uint256) public virtual;

  function transfer(address, uint256) public virtual returns (bool);

  function transferFrom(address, address, uint256) public virtual returns (bool);

  function deposit() public payable virtual;

  function withdraw(uint256) public virtual;

  function allowance(address, address) public virtual returns (uint256);
}
