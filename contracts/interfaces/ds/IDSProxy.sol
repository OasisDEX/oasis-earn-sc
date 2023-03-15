pragma solidity ^0.8.15;

interface IDSProxy {
  function owner() external returns (address);

  function execute(bytes memory, bytes memory) external payable returns (address, bytes memory);

  function execute(address, bytes memory) external payable returns (bytes memory);

  function setCache(address _cacheAddr) external returns (bool);
}
