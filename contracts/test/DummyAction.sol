pragma solidity ^0.8.15;

import "../actions/common/Executable.sol";
import "../core/ServiceRegistry.sol";
import "../core/OperationStorage.sol";
import { OPERATION_STORAGE } from "../core/constants/Common.sol";

contract DummyAction is Executable {
  ServiceRegistry internal immutable registry;

  constructor(address _registry) {
    registry = ServiceRegistry(_registry);
  }

  function execute(bytes calldata data, uint8[] memory) external payable override {
    OperationStorage txStorage = OperationStorage(registry.getRegisteredService(OPERATION_STORAGE));
    console.log(txStorage.len());
  }
}
