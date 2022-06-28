//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.5;

// TODO: This needs to be removed
import "hardhat/console.sol";

import "./ServiceRegistry.sol";
import "./OperationStorage.sol";
import "./OperationsRegistry.sol";
import "../libs/DS/DSProxy.sol";
import "../libs/Address.sol";
import "../actions/common/TakeFlashloan.sol";
import "../interfaces/tokens/IERC20.sol";
import "../interfaces/flashloan/IERC3156FlashBorrower.sol";
import "../interfaces/flashloan/IERC3156FlashLender.sol";
import { FlashloanData, Call } from "./types/Common.sol";
import { OPERATION_STORAGE, OPERATIONS_REGISTRY } from "./constants/Common.sol";
import { FLASH_MINT_MODULE } from "./constants/Maker.sol";

contract OperationExecutor is IERC3156FlashBorrower {
  using Address for address;

  ServiceRegistry public immutable registry;

  constructor(ServiceRegistry _registry) {
    registry = _registry;
  }

  function executeOp(Call[] memory calls, string calldata operationName) public {
    OperationStorage opStorage = OperationStorage(registry.getRegisteredService(OPERATION_STORAGE));

    OperationsRegistry opRegistry = OperationsRegistry(
      registry.getRegisteredService(OPERATIONS_REGISTRY)
    );
    opStorage.setOperationActions(opRegistry.getOperation(operationName));

    aggregate(calls);

    opStorage.finalize();
  }

  function aggregate(Call[] memory calls) public {
    OperationStorage opStorage = OperationStorage(registry.getRegisteredService(OPERATION_STORAGE));
    bool hasActionsToVerify = opStorage.hasActionsToVerify();
    for (uint256 current = 0; current < calls.length; current++) {
      if (hasActionsToVerify) {
        opStorage.verifyAction(calls[current].targetHash);
      }

      address target = registry.getServiceAddress(calls[current].targetHash);

      target.functionDelegateCall(
        calls[current].callData,
        "OpExecutor: low-level delegatecall failed"
      );
    }
  }

  function onFlashLoan(
    address initiator, // this is actually the proxy address
    address asset,
    uint256 amount,
    uint256, // fee - the implementation should support the fee even though now it's 0
    bytes calldata data
  ) external override returns (bytes32) {
    address lender = registry.getRegisteredService(FLASH_MINT_MODULE);
    FlashloanData memory flData = abi.decode(data, (FlashloanData));

    // TODO - Use custom errors from solidity introduced in 0.8.4  https://blog.soliditylang.org/2021/04/21/custom-errors/
    require(amount == flData.amount, "loan-inconsistency");

    IERC20(asset).transfer(initiator, flData.amount);

    DSProxy(payable(initiator)).execute(
      address(this),
      abi.encodeWithSelector(this.aggregate.selector, flData.calls)
    );

    IERC20(asset).approve(lender, amount);

    return keccak256("ERC3156FlashBorrower.onFlashLoan");
  }
}
