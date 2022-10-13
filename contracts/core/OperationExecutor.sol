//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.15;

import { ServiceRegistry } from "./ServiceRegistry.sol";
import { OperationStorage } from "./OperationStorage.sol";
import { OperationsRegistry } from "./OperationsRegistry.sol";
import { DSProxy } from "../libs/DS/DSProxy.sol";
import { Address } from "../libs/Address.sol";
import { TakeFlashloan } from "../actions/common/TakeFlashloan.sol";
import { IERC3156FlashBorrower } from "../interfaces/flashloan/IERC3156FlashBorrower.sol";
import { IERC3156FlashLender } from "../interfaces/flashloan/IERC3156FlashLender.sol";
import { SafeERC20, IERC20 } from "../libs/SafeERC20.sol";
import { SafeMath } from "../libs/SafeMath.sol";
import { FlashloanData, Call } from "./types/Common.sol";
import { OPERATION_STORAGE, OPERATIONS_REGISTRY, OPERATION_EXECUTOR } from "./constants/Common.sol";
import { FLASH_MINT_MODULE } from "./constants/Maker.sol";

/**
 * @title Operation Executor
 * @notice Is responsible for executing sequences of Actions (Operations)
 */
contract OperationExecutor is IERC3156FlashBorrower {
  using Address for address;
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  ServiceRegistry public immutable registry;

  /**
   * @dev Emitted once an Operation has completed execution
   * @param name The address initiating the deposit
   * @param calls An array of Action calls the operation must execute
   **/
  event Operation(string name, Call[] calls);

  constructor(ServiceRegistry _registry) {
    registry = _registry;
  }

  /**
   * @notice Executes an operation
   * @dev Operation storage is cleared before and after an operation is executed
   * @param calls An array of Action calls the operation must execute
   * @param operationName The name of the Operation being executed
   */
  function executeOp(Call[] memory calls, string calldata operationName) public payable {
    OperationStorage opStorage = OperationStorage(registry.getRegisteredService(OPERATION_STORAGE));
    opStorage.lock();
    OperationsRegistry opRegistry = OperationsRegistry(
      registry.getRegisteredService(OPERATIONS_REGISTRY)
    );

    opStorage.clearStorage();
    opStorage.setOperationActions(opRegistry.getOperation(operationName));
    aggregate(calls);

    opStorage.clearStorage();
    opStorage.unlock();
    emit Operation(operationName, calls);
  }

  function aggregate(Call[] memory calls) internal {
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

  /**
   * @notice Not to be called directly
   * @dev Is called by the Operation Executor via a user's proxy to execute Actions nested in the FlashloanAction
   * @param calls An array of Action calls the operation must execute
   */
  function callbackAggregate(Call[] memory calls) external {
    require(
      msg.sender == registry.getRegisteredService(OPERATION_EXECUTOR),
      "OpExecutor: Caller forbidden"
    );
    aggregate(calls);
  }

  /**
   * @notice Not to be called directly.
   * @dev Callback handler for use by a flashloan lender contract.
   * If the dsProxyFlashloan flag is supplied we reestablish the calling context as the user's proxy (at time of writing DSProxy)
   * We set the initiator on Operation Storage

      * @dev
   * There are operations stored at OperationsRegistry which guarantees the order of execution of the actions.
   * There is a possibility to execute an arrays of calls that don't form an operation.
   * Operation storage is cleared before and after an operation is executed.
   * To avoid re-entracy attack, there is a lock implemented.


   * @param initiator Is the address of the contract that initiated the flashloan (EG Operation Executor)
   * @param asset The address of the asset being flash loaned
   * @param amount The size of the flash loan
   * @param fee The Fee charged for the loan
   * @param data Any calldata sent to the contract for execution later in the callback
   */
  function onFlashLoan(
    address initiator,
    address asset,
    uint256 amount,
    uint256 fee,
    bytes calldata data
  ) external override returns (bytes32) {
    address lender = registry.getRegisteredService(FLASH_MINT_MODULE);

    require(msg.sender == lender, "Untrusted flashloan lender");

    FlashloanData memory flData = abi.decode(data, (FlashloanData));

    require(IERC20(asset).balanceOf(address(this)) >= flData.amount, "Flashloan inconsistency");

    if (flData.dsProxyFlashloan) {
      IERC20(asset).safeTransfer(initiator, flData.amount);

      DSProxy(payable(initiator)).execute(
        address(this),
        abi.encodeWithSelector(this.callbackAggregate.selector, flData.calls)
      );
    } else {
      OperationStorage opStorage = OperationStorage(
        registry.getRegisteredService(OPERATION_STORAGE)
      );
      opStorage.setInitiator(initiator);
      aggregate(flData.calls);
    }

    uint256 paybackAmount = amount.add(fee);
    require(
      IERC20(asset).balanceOf(address(this)) >= paybackAmount,
      "Insufficient funds for payback"
    );

    IERC20(asset).safeApprove(lender, paybackAmount);

    return keccak256("ERC3156FlashBorrower.onFlashLoan");
  }
}
