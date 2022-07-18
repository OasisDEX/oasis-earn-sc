pragma solidity ^0.8.5;

import { Operation } from "./types/Common.sol";

contract OperationsRegistry {
  mapping(string => bytes32[]) private operations;

  function addOperation(string memory name, bytes32[] memory actions) external {
    operations[name] = actions;
  }

  function getOperation(string memory name) external view returns (bytes32[] memory actions) {
    actions = operations[name];
  }
}
