pragma solidity ^0.8.1;
import { ServiceRegistry } from "../core/ServiceRegistry.sol";
import {OperationExecutor} from "../core/OperationExecutor.sol";
import { MathUtils } from "../libs/MathUtils.sol";
import { SafeMath } from "../libs/SafeMath.sol";
import {  Call } from "../core/types/Common.sol";
import { Address } from "../libs/Address.sol";
import { IManager } from "../interfaces/maker/IManager.sol";
import { MCD_MANAGER } from "../core/constants/Maker.sol";

contract DummyAutomation {
    using SafeMath for uint256;
    using Address for address;

    ServiceRegistry internal immutable registry;

   constructor(ServiceRegistry _registry) {
    registry = _registry;
  }
  // call to OperationExecutor
  // function doAutomationStuff(Call[] memory calls, string calldata operationName, address opExecutorAddress) public  {
  //     OperationExecutor opExecutor = OperationExecutor(opExecutorAddress);
  //     opExecutor.executeOp(calls, operationName);
  // }

  // delegatecall to OperationExecutor
  function doAutomationStuffDelegateCall(bytes calldata executionData, address opExecutorAddress, uint256 vaultId) public  {
    IManager manager = IManager(registry.getRegisteredService(MCD_MANAGER));

    manager.cdpAllow(
      vaultId,
      opExecutorAddress,
      1
    );

    opExecutorAddress.functionDelegateCall(
      executionData,
      "DummyAutomation: low-level delegatecall failed"
    );

    manager.cdpAllow(
      vaultId,
      opExecutorAddress,
      0
    );
  }
}
