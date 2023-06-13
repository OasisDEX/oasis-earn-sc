// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

/**
 * @title Operation Registry
 * @notice Stores the Actions that constitute a given Operation and information if an Action can be skipped

 */
contract OperationsRegistryV2 {
  mapping(bytes32 => bytes32) private operations;
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
   * @param operationHash Hashed value of the concatenated hash values of all action that take place in this operation
   **/
  event OperationAdded(string name, bytes32 operationHash);

  /**
   * @notice Adds an Operation's Actions keyed to a an operation name
   * @param operationHash Struct with Operation name, actions and their optionality
   */
  function addOperation(string memory name, bytes32 operationHash) external onlyOwner {
    operations[operationHash] = bytes32(bytes(name));
    // By packing the string into bytes32 which means the max char length is capped at 64
    emit OperationAdded(name, operationHash);
  }

  /**
   * @notice Returns either a valid name of an added operation or empty string if the operation doesn't exist
   * @param operationHash Hashed value of the concatenated hash values of all action that take place in this operation
   */
  function getOperationName(bytes32 operationHash) external view returns (bytes32 name) {
    name = operations[operationHash];
  }
}
