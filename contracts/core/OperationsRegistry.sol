pragma solidity ^0.8.5;

import { Operation } from "./types/Common.sol";

struct StoredOperation {
  bytes32[] actions;
  string name;
}

contract OperationsRegistry {
  mapping(string => StoredOperation) private operations;

  function addOperation(string memory name, bytes32[] memory actions) external {
    operations[name] = StoredOperation(actions, name);
  }

  function getOperation(string memory name) external view returns (bytes32[] memory actions) {
    if(keccak256(bytes(operations[name].name)) == keccak256(bytes(""))) {
      revert("Operation doesn't exist");
    }
    actions = operations[name].actions;
  }
}