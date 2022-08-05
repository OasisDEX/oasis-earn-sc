pragma solidity ^0.8.5;

import { Operation } from "./types/Common.sol";
import { OPERATIONS_REGISTRY } from "./constants/Common.sol";

contract OperationsRegistry {
  mapping(string => bytes32[]) private operations;

  /**
   * @dev Emitted when a new operation is added or an existing operation is updated
   * @param name The Operation name
   **/
  event OperationAdded(string name);

  function addOperation(string memory name, bytes32[] memory actions) external {
    operations[name] = actions;

    emit OperationAdded(name);
  }

  function getOperation(string memory name) external view returns (bytes32[] memory actions) {
    actions = operations[name];
  }
}
