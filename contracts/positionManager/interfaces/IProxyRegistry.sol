// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

abstract contract IProxyRegistry {
    function proxies(address _owner) public view virtual returns (address);

    function build(address) public virtual returns (address);
}
