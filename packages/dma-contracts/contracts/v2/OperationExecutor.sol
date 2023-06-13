//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.15;

import { OperationsRegistryV2 } from "./OperationsRegistry.sol";
import { ServiceRegistry } from "../core/ServiceRegistry.sol";
import { ChainLogView } from "../core/views/ChainLogView.sol";
import { StorageSlot } from "./UseStorageSlot.sol";
import { ActionAddress } from "../libs/ActionAddress.sol";
import { TakeFlashloan } from "../actions/common/TakeFlashloan.sol";
import { Executable } from "../actions/common/Executable.sol";
import { IERC3156FlashBorrower } from "../interfaces/flashloan/IERC3156FlashBorrower.sol";
import { IERC3156FlashLender } from "../interfaces/flashloan/IERC3156FlashLender.sol";
import { IFlashLoanRecipient } from "../interfaces/flashloan/balancer/IFlashLoanRecipient.sol";
import { SafeERC20, IERC20 } from "../libs/SafeERC20.sol";
import { SafeMath } from "../libs/SafeMath.sol";
import { FlashloanData, Call } from "../core/types/Common.sol";
import { MCD_FLASH } from "../core/constants/Maker.sol";

error UntrustedLender(address lender);
error UnknownActionsSet(bytes packedActionHashes);
error InconsistentAsset(address flashloaned, address required);
error InconsistentAmount(uint256 flashloaned, uint256 required);
error InsufficientFunds(uint256 actual, uint256 required);
error ForbiddenCall(address caller);

interface IProxy {
  function execute(address, bytes memory) external payable returns (bytes memory);
}

interface IOperationStorage {
  function setInitiator(address) external;
}

/**
 * @title Operation Executor
 * @notice Is responsible for executing sequences of Actions (Operations)
 */

contract OperationExecutorV2 is IERC3156FlashBorrower, IFlashLoanRecipient {
  using ActionAddress for address;
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  ServiceRegistry immutable REGISTRY;
  OperationsRegistryV2 immutable OPERATIONS_REGISTRY;
  ChainLogView immutable CHAINLOG_VIEWER;
  address immutable BALANCER_VAULT;
  address immutable OPERATION_EXECUTOR;
  /**
   * @dev Emitted once an Operation has completed execution
   * @param name Name of the operation based on the hashed value of all action hashes
   * @param calls An array of Action calls the operation must execute
   **/
  event Operation(bytes32 indexed name, Call[] calls);

  constructor(
    ServiceRegistry _registry,
    OperationsRegistryV2 _operationsRegistry,
    ChainLogView _chainLogView,
    address _balanacerVault
  ) {
    REGISTRY = _registry;
    OPERATIONS_REGISTRY = _operationsRegistry;
    CHAINLOG_VIEWER = _chainLogView;
    BALANCER_VAULT = _balanacerVault;
    OPERATION_EXECUTOR = address(this);
  }

  function executeOp(Call[] memory calls) public payable {
    StorageSlot.TransactionStorage storage txStorage = StorageSlot.getTransactionStorage();
    delete txStorage.actions;
    delete txStorage.returnedValues;

    aggregate(calls);
    bytes32 operationName = OPERATIONS_REGISTRY.getOperationName(keccak256(txStorage.actions));

    if (operationName == bytes32("")) {
      revert UnknownActionsSet(txStorage.actions);
    }

    delete txStorage.actions;
    delete txStorage.returnedValues;
    // By packing the string into bytes32 which means the max char length is capped at 64
    emit Operation(operationName, calls);
  }

  function aggregate(Call[] memory calls) internal {
    StorageSlot.TransactionStorage storage txStorage = StorageSlot.getTransactionStorage();

    for (uint256 current = 0; current < calls.length; current++) {
      bytes32 targetHash = calls[current].targetHash;
      address target = REGISTRY.getServiceAddress(targetHash);
      txStorage.actions = abi.encodePacked(txStorage.actions, targetHash);
      target.execute(calls[current].callData);
    }
  }

  /**
   * @notice Not to be called directly
   * @dev Is called by the Operation Executor via a user's proxy to execute Actions nested in the FlashloanAction
   * @param calls An array of Action calls the operation must execute
   */
  function callbackAggregate(Call[] memory calls) external {
    if (msg.sender != OPERATION_EXECUTOR) {
      revert ForbiddenCall(msg.sender);
    }
    aggregate(calls);
  }

  /**
   * @notice Not to be called directly.
   * @dev Callback handler for use by a flashloan lender contract.
   * If the isProxyFlashloan flag is supplied we reestablish the calling context as the user's proxy (at time of writing DSProxy). Although stored values will
   * We set the initiator on Operation Storage such that calls originating from other contracts EG Oasis Automation Bot (see https://github.com/OasisDEX/automation-smartcontracts)
   * The initiator address will be used to store values against the original msg.sender.
   * This protects against the Operation Storage values being polluted by malicious code from untrusted 3rd party contracts.

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
    FlashloanData memory flData = abi.decode(data, (FlashloanData));
    address mcdFlash = CHAINLOG_VIEWER.getServiceAddress(MCD_FLASH);
    checkIfLenderIsTrusted(mcdFlash);
    checkIfFlashloanedAssetIsTheRequiredOne(asset, flData.asset);
    checkIfFlashloanedAmountIsTheRequiredOne(asset, flData.amount);

    processFlashloan(flData, initiator);

    uint256 paybackAmount = amount.add(fee);
    uint256 funds = IERC20(asset).balanceOf(address(this));
    if (funds < paybackAmount) {
      revert InsufficientFunds(funds, paybackAmount);
    }
    IERC20(asset).safeApprove(mcdFlash, paybackAmount);
    return keccak256("ERC3156FlashBorrower.onFlashLoan");
  }

  function receiveFlashLoan(
    IERC20[] memory tokens,
    uint256[] memory amounts,
    uint256[] memory feeAmounts,
    bytes memory data
  ) external override {
    address asset = address(tokens[0]);
    (FlashloanData memory flData, address initiator) = abi.decode(data, (FlashloanData, address));

    checkIfLenderIsTrusted(BALANCER_VAULT);
    checkIfFlashloanedAssetIsTheRequiredOne(asset, flData.asset);
    checkIfFlashloanedAmountIsTheRequiredOne(asset, flData.amount);

    processFlashloan(flData, initiator);

    uint256 paybackAmount = amounts[0].add(feeAmounts[0]);

    uint256 funds = IERC20(asset).balanceOf(address(this));
    if (funds < paybackAmount) {
      revert InsufficientFunds(funds, paybackAmount);
    }

    IERC20(asset).safeTransfer(BALANCER_VAULT, paybackAmount);
  }

  function checkIfLenderIsTrusted(address lender) public view {
    if (msg.sender != lender) revert UntrustedLender(msg.sender);
  }

  function checkIfFlashloanedAssetIsTheRequiredOne(
    address flashloaned,
    address required
  ) public pure {
    if (flashloaned != required) revert InconsistentAsset(flashloaned, required);
  }

  function checkIfFlashloanedAmountIsTheRequiredOne(
    address asset,
    uint256 requiredAmount
  ) public view {
    uint256 assetBalance = IERC20(asset).balanceOf(address(this));
    if (assetBalance < requiredAmount) revert InconsistentAmount(assetBalance, requiredAmount);
  }

  function processFlashloan(FlashloanData memory flData, address initiator) private {
    IERC20(flData.asset).safeTransfer(initiator, flData.amount);
    IProxy(payable(initiator)).execute(
      address(this),
      abi.encodeWithSelector(this.callbackAggregate.selector, flData.calls)
    );
  }
}
