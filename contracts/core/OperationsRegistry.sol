pragma solidity ^0.8.15;

import { StoredOperation } from "./types/Common.sol";
import { OPERATIONS_REGISTRY } from "./constants/Common.sol";

/**
 * @title Operation Registry
 * @notice Stores the Actions that constitute a given Operation and information if an Action can be skipped

 */

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
  event OperationAdded(string name);

  function addOperation(StoredOperation calldata operation) external onlyOwner {
    operations[operation.name] = operation;
    emit OperationAdded(operation.name);
  }

  function getOperation(string memory name)
    external
    view
    returns (StoredOperation memory operation)
  {
    if (keccak256(bytes(operations[name].name)) == keccak256(bytes(""))) {
      revert("Operation doesn't exist");
    }
    operation = operations[name];
  }
}
