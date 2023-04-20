// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.6.0;

import { DSAuth } from "./DSAuth.sol";
import { DSNote } from "./DSNote.sol";

contract DSProxy is DSAuth, DSNote {
  DSProxyCache public cache; // global cache for dma-contracts

  constructor(address _cacheAddr) public {
    setCache(_cacheAddr);
  }

  function() external payable {}

  // use the proxy to execute calldata _data on contract _code
  function execute(
    bytes memory _code,
    bytes memory _data
  ) public payable returns (address target, bytes memory response) {
    target = cache.read(_code);
    if (target == address(0)) {
      // deploy contract & store its address in cache
      target = cache.write(_code);
    }

    response = execute(target, _data);
  }

  function execute(
    address _target,
    bytes memory _data
  ) public payable auth note returns (bytes memory response) {
    require(_target != address(0), "ds-proxy-target-address-required");

    // call contract in current context
    assembly {
      let succeeded := delegatecall(sub(gas, 5000), _target, add(_data, 0x20), mload(_data), 0, 0)
      let size := returndatasize

      response := mload(0x40)
      mstore(0x40, add(response, and(add(add(size, 0x20), 0x1f), not(0x1f))))
      mstore(response, size)
      returndatacopy(add(response, 0x20), 0, size)

      switch iszero(succeeded)
      case 1 {
        // throw if delegatecall failed
        revert(add(response, 0x20), size)
      }
    }
  }

  //set new cache
  function setCache(address _cacheAddr) public payable auth note returns (bool) {
    require(_cacheAddr != address(0), "ds-proxy-cache-address-required");
    cache = DSProxyCache(_cacheAddr); // overwrite cache
    return true;
  }
}

contract DSProxyFactory {
  event Created(address indexed sender, address indexed owner, address proxy, address cache);
  mapping(address => bool) public isProxy;
  DSProxyCache public cache;

  constructor() public {
    cache = new DSProxyCache();
  }

  // deploys a new proxy instance
  // sets owner of proxy to caller
  function build() public returns (address payable proxy) {
    proxy = build(msg.sender);
  }

  // deploys a new proxy instance
  // sets custom owner of proxy
  function build(address owner) public returns (address payable proxy) {
    proxy = address(new DSProxy(address(cache)));
    emit Created(msg.sender, owner, address(proxy), address(cache));
    DSProxy(proxy).setOwner(owner);
    isProxy[proxy] = true;
  }
}

contract DSProxyCache {
  mapping(bytes32 => address) cache;

  function read(bytes memory _code) public view returns (address) {
    bytes32 hash = keccak256(_code);
    return cache[hash];
  }

  function write(bytes memory _code) public returns (address target) {
    assembly {
      target := create(0, add(_code, 0x20), mload(_code))
      switch iszero(extcodesize(target))
      case 1 {
        // throw if contract failed to deploy
        revert(0, 0)
      }
    }
    bytes32 hash = keccak256(_code);
    cache[hash] = target;
  }
}
