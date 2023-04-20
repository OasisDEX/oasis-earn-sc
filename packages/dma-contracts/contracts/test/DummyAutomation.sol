// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.15;

import { ServiceRegistry } from "../core/ServiceRegistry.sol";
import { OperationExecutor } from "../core/OperationExecutor.sol";
import { MathUtils } from "../libs/MathUtils.sol";
import { SafeMath } from "../libs/SafeMath.sol";
import { Call } from "../core/types/Common.sol";
import { Address } from "../libs/Address.sol";
import { IManager } from "../interfaces/maker/IManager.sol";
import { MCD_MANAGER } from "../core/constants/Maker.sol";
import { DummyCommand } from "./DummyCommand.sol";

contract DummyAutomation {
  using SafeMath for uint256;
  using Address for address;

  ServiceRegistry internal immutable registry;

  constructor(ServiceRegistry _registry) {
    registry = _registry;
  }

  function doAutomationStuffDelegateCall(
    bytes calldata executionData,
    address opExecutorAddress,
    uint256 vaultId,
    address commandAddress
  ) public {
    IManager manager = IManager(registry.getRegisteredService(MCD_MANAGER));
    manager.cdpAllow(vaultId, commandAddress, 1);
    DummyCommand(commandAddress).execute(executionData, opExecutorAddress);
    manager.cdpAllow(vaultId, commandAddress, 0);
  }
}
