
// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

/**
 * @notice This error is thrown when there is no operation found for a given operation hash
 */
error UnknownOperationHash(bytes32 packedActionHashes);

/**
 * @title Operation Registry
 * @notice The system of contracts that uses OperationRegistry works with contracts that are called 'Actions'.
 * List of actions in a specific order forms an Operation.
 * This contract is used to store these operations.
 */
contract OperationsRegistry {
  mapping(bytes32 => bytes32) private operations;

  ///@notice Owner of the countract. Allowed to add new operations.
  address public owner;

  modifier onlyOwner() {
    require(msg.sender == owner, "only-owner");
    _;
  }

  constructor() {
    owner = msg.sender;
  }

  /**
   * @dev Emitted when a new operation is added.
   * @param name The Operation name
   * @param operationHash A hashed value of all action hashes ( concatenated )
   **/
  event OperationAdded(string name, bytes32 operationHash);

  /**
   * @notice Adds an operation under specific name for a specific ordered list of actions
   * @dev Each action is stored in a ServiceRepository under a specific hash.
   * To get the operationHash, one should concatenated all hashes of the actions
   * that are used in the specific operation and hash them using keccak256.
   * The order of the actions matters since different order will result in different hash value
   * hence difference operation.
   * @param name Name of the operation that is going to be stored
   * @param operationHash A hash of all action hashes ( concatenated )
   */
  function addOperation(string memory name, bytes32 operationHash) external onlyOwner {
    require(operations[operationHash] == bytes32(""), "op-registry/operation-exists");
  
    operations[operationHash] = bytes32(bytes(name));
    // By packing the string into bytes32 which means the max char length is capped at 64
    emit OperationAdded(name, operationHash);
  }

  /**
   * @notice Returns either a valid name of an added operation or reverts with an error if no operation is found.
   * @param operationHash A hashed value of all action hashes ( concatenated ).
   */
  function getOperationName(bytes32 operationHash) external view returns (bytes32 name) {
    name = operations[operationHash];

    if (name == bytes32("")) {
      revert UnknownOperationHash(operationHash);
    }
  }

  /**
   * @notice Changes the owner of the contract
   * @param newOwner The address of the new owner of the Operations Registry
   */
  function transferOwnership(address newOwner) external onlyOwner {
    owner = newOwner;
  }
}