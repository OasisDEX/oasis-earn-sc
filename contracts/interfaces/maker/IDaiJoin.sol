// SPDX-License-Identifier: MIT

pragma solidity ^0.8.15;

import "./IVat.sol";

abstract contract IDaiJoin {
  function vat() public virtual returns (IVat);

  function dai() public virtual returns (address);

  function join(address, uint256) public payable virtual;

  function exit(address, uint256) public virtual;
}
