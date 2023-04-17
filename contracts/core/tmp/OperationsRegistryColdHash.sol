// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Operation } from "../types/Common.sol";
import { OPERATIONS_REGISTRY } from "../constants/Common.sol";

struct StoredOperation {
  bytes32[] actions;
  bool[] optional;
  string name;
}

/**
 * @title Operation Registry
 * @notice Stores the Actions that constitute a given Operation and information if an Action can be skipped

 */
contract OperationsRegistryColdHash {
  mapping(bytes32 => bool) private operations;
  address public owner;

  modifier onlyOwner() {
    require(msg.sender == owner, "only-owner");
    _;
  }

  constructor() {
    owner = msg.sender;
  }

  /**
   * @notice Stores the Actions that constitute a given Operation
   * @param newOwner The address of the new owner of the Operations Registry
   */
  function transferOwnership(address newOwner) public onlyOwner {
    owner = newOwner;
  }

  /**
   * @dev Emitted when a new operation is added or an existing operation is updated
   * @param name The Operation name
   **/
  event OperationAdded(bytes32 indexed name);

  /**
   * @notice Adds an Operation's Actions keyed to a an operation name
   * @param operationHash Struct with Operation name, actions and their optionality
   */
  function addOperation(bytes32 operationHash) external onlyOwner {
    operations[operationHash] = true;
    // By packing the string into bytes32 which means the max char length is capped at 64
    emit OperationAdded(operationHash);
  }

  function isWhitelisted(bytes32 operationHash) external view returns (bool) {
    return operations[operationHash];
  }
}
