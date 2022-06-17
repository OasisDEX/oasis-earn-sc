pragma solidity ^0.8.5;

import { Operation } from "./types/Common.sol";

contract OperationsRegistry {
  mapping(string => bytes32[]) private operations;

  function addOperation(string memory name, bytes32[] memory steps) external {
    operations[name] = steps;
  }

  function getOperation(string memory name) external view returns (bytes32[] memory steps) {
    steps = operations[name];
    require(steps.length > 0, "noop");
  }
}
