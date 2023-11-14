// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.15;

import { ServiceRegistry } from "../core/ServiceRegistry.sol";
import { OperationExecutor } from "../core/OperationExecutor.sol";
import { MathUtils } from "../libs/MathUtils.sol";
import { SafeMath } from "../libs/SafeMath.sol";
import { Call } from "../core/types/Common.sol";
import { Address } from "../libs/Address.sol";
import { IManager } from "../interfaces/maker/IManager.sol";

contract DummyCommand {
  using SafeMath for uint256;
  using Address for address;

  ServiceRegistry internal immutable registry;

  constructor(ServiceRegistry _registry) {
    registry = _registry;
  }

  function execute(bytes calldata executionData, address opExecutorAddress) public {
    opExecutorAddress.functionDelegateCall(
      executionData,
      "DummyAutomation: low-level delegatecall failed"
    );
  }
}
