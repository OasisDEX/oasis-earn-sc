// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { OperationStorage } from "../core/OperationStorage.sol";
import { ServiceRegistry } from "../core/ServiceRegistry.sol";
import { OPERATION_STORAGE } from "../core/constants/Common.sol";

/**
 * @title UseRegistry contract
 * @notice Provides common interface for all Actions to access the ServiceRegistry contract
 */

contract UseRegistry { 
  ServiceRegistry private immutable _registry;
  constructor(ServiceRegistry registry_) {
    _registry = registry_;
  } 

  function getRegisteredService(string memory service) internal view returns (address) {
    return _registry.getRegisteredService(service); 
  }
}
