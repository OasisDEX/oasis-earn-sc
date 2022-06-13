pragma solidity ^0.8.5;

import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";

library Read {
  function read(
    OperationStorage _storage,
    bytes32 param,
    uint256 paramMapping
  ) internal view returns (bytes32) {
    if (paramMapping > 0) {
      return _storage.at(paramMapping);
    }

    return param;
  }
}

library Write {
  function write(OperationStorage _storage, bytes32 value) internal {
    _storage.push(value);
  }
}

abstract contract UseStore {
  ServiceRegistry internal immutable registry;

  constructor(address _registry) {
    registry = ServiceRegistry(_registry);
  }

  function store() internal view returns (OperationStorage) {
    return OperationStorage(registry.getRegisteredService("OPERATION_STORAGE"));
  }
}
