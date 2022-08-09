pragma solidity ^0.8.15;

import { Operation } from "./types/Common.sol";

struct StoredOperation {
  bytes32[] actions;
  string name;
}

contract OperationsRegistry {
  mapping(string => StoredOperation) private operations;
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