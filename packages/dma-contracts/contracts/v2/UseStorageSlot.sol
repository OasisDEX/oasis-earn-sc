pragma solidity ^0.8.15;

library StorageSlot {
  struct TransactionStorage {
    bytes actions;
    bytes32[] returnedValues;
  }

  function getTransactionStorage() internal pure returns (TransactionStorage storage tStorage) {
    bytes32 slotPosition = bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1);

    assembly {
      tStorage.slot := slotPosition
    }
  }
}

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
