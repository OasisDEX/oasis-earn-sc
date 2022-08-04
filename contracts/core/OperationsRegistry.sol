pragma solidity ^0.8.5;

import { Operation } from "./types/Common.sol";

contract OperationsRegistry {
  mapping(string => bytes32[]) private operations;
  address public owner;

  modifier onlyOwner() {
    require(msg.sender == owner, "only-owner");
    _;
  }

  constructor() {
    owner = msg.sender;
  }

  function transferOwnership(address newOwner) public onlyOwner {
    owner = newOwner;
  }

  function addOperation(string memory name, bytes32[] memory actions) external onlyOwner {
    operations[name] = actions;
  }

  function getOperation(string memory name) external view returns (bytes32[] memory actions) {
    actions = operations[name];
  }
}
