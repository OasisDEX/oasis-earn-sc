// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

/**
 * @title A library that operates on a storage slot
 * @notice This library is a small implementation of EIP-1967. Unlike that EIP which usage
 * is to store an address to an implementation under specific slot,
 * it is used to storage all kind of information that is going to be used during a transaction life time.
 * @dev The system of contracts that utilize this library work under the assumption
 * that all contracts are called in the scope of a proxy. Using the library will create a storage pointer
 * to a slot in the Proxy instance.
 * The `TransactionStorage` structure contains the following properties:
 *  - actions - This is used to store ( by concatenation ) executed action hashes. At the end,
 * this value is hashed using `keccak256` and used to check if there is an operation that exists in the
 * OperationRegistry
 *  - returnedValues - Used to store values from actions. It is used to share values between actions and
 * other interested contacts
 */
library StorageSlot {
  struct TransactionStorage {
    bytes actions;
    bytes32[] returnedValues;
  }

  /**
   * @notice Used to get a storage slot at a specific slot position
   */
  function getTransactionStorage() internal pure returns (TransactionStorage storage tStorage) {
    bytes32 slotPosition = bytes32(uint256(keccak256("proxy.transaction.storage")) - 1);

    assembly {
      tStorage.slot := slotPosition
    }
  }
}

/**
 * @title Used to read from the StorageSlot
 * @notice There is a structure used in the StorageSlot library that is used
 * to create a storage pointer. This library read from a specific property of that structure.
 * It is used to read a specific returned value from an Action.
 */
library Read {
  function read(
    StorageSlot.TransactionStorage storage _storage,
    bytes32 param,
    uint256 paramMapping
  ) internal view returns (bytes32) {
    if (paramMapping > 0) {
      return _storage.returnedValues[paramMapping - 1];
    }

    return param;
  }

  function readUint(
    StorageSlot.TransactionStorage storage _storage,
    bytes32 param,
    uint256 paramMapping
  ) internal view returns (uint256) {
    return uint256(read(_storage, param, paramMapping));
  }
}

/**
 * @title Used to write to the StorageSlot
 * @notice There is a structure used in the StorageSlot library that is used
 * to create a storage pointer. This library writes to a specific property of that structure
 * that is responsible for sharing the returned values from an Action.
 */
library Write {
  function write(StorageSlot.TransactionStorage storage _storage, bytes32 value) internal {
    _storage.returnedValues.push(value);
  }
}

abstract contract UseStorageSlot {
  function store() internal pure returns (StorageSlot.TransactionStorage storage) {
    return StorageSlot.getTransactionStorage();
  }
}
