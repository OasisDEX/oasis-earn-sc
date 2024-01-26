// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { OperationsRegistry } from "./OperationsRegistry.sol";
import { ServiceRegistry } from "../core/ServiceRegistry.sol";
import { ChainLogView } from "../core/views/ChainLogView.sol";
import { StorageSlot } from "../libs/UseStorageSlot.sol";
import { ActionAddress } from "../libs/ActionAddress.sol";
import { TakeFlashloan } from "../actions/common/TakeFlashloan.sol";
import { Executable } from "../actions/common/Executable.sol";
import { IERC3156FlashBorrower } from "../interfaces/flashloan/IERC3156FlashBorrower.sol";
import { IERC3156FlashLender } from "../interfaces/flashloan/IERC3156FlashLender.sol";
import { IFlashLoanRecipient } from "../interfaces/flashloan/balancer/IFlashLoanRecipient.sol";
import { SafeERC20, IERC20 } from "../libs/SafeERC20.sol";
import { FlashloanData, Call } from "./types/Common.sol";
import { MCD_FLASH } from "../core/constants/Maker.sol";

error UntrustedLender(address lender);
error InconsistentAsset(address flashloaned, address required);
error InconsistentAmount(uint256 flashloaned, uint256 required);
error InsufficientFunds(uint256 actual, uint256 required);
error ForbiddenCall(address caller);
error FlashloanReentrancyAttempt();

interface IProxy {
  function execute(address, bytes memory) external payable returns (bytes memory);
}

/**
 * @title Operation Executor
 * @notice Is responsible for executing sequences of Actions (Operations).
 * Also it acts as a flashloan recipient
 */

contract OperationExecutor is IERC3156FlashBorrower, IFlashLoanRecipient {
  using ActionAddress for address;
  using SafeERC20 for IERC20;

  ServiceRegistry immutable REGISTRY;
  OperationsRegistry immutable OPERATIONS_REGISTRY;
  ChainLogView immutable CHAINLOG_VIEWER;
  address immutable BALANCER_VAULT;
  address immutable OPERATION_EXECUTOR;
  uint8 private isFlashloanInProgress = 1;

  bytes32 public constant ERC3156_FLASHLOAN_MSG = keccak256("ERC3156FlashBorrower.onFlashLoan");

  /**
   * @dev Emitted once an Operation has completed execution
   * @param name Name of the operation based on the hashed value of all action hashes
   * @param calls An array of Actions that are executed
   **/
  event Operation(bytes32 indexed name, Call[] calls);

  constructor(
    ServiceRegistry _registry,
    OperationsRegistry _operationsRegistry,
    ChainLogView _chainLogView,
    address _balancerVault
  ) {
    REGISTRY = _registry;
    OPERATIONS_REGISTRY = _operationsRegistry;
    CHAINLOG_VIEWER = _chainLogView;
    BALANCER_VAULT = _balancerVault;
    OPERATION_EXECUTOR = address(this);
  }

  /**
   * @notice Executes a list of action calls that form an Operation
   * @dev Call to this contract MUST be done through a Proxy contract.
   * Either through a https://github.com/makerdao/ds-proxy
   * or https://github.com/OasisDEX/defi-position-manager-smartcontracts/blob/master/contracts/AccountImplementation.sol
   * or something similar.
   *
   * During the transaction execution there is a proxy storage slot reserved that keeps
   * all the data that's used during the transaction execution.
   * After transaction completes, the data in that slot is deleted.
   *
   * During the execution each action hash is added to a common variable and then
   * the whole thing is hashed using keccak256.
   * Then using that hased value there is a lookup in the OperationsRegistry for a specific operation
   * that corresponds to that value, If there isn't, the transaction reverts.
   *
   * @param calls List of action calls to be executed.
   */
  function executeOp(Call[] memory calls) public payable returns (bytes32) {
    
    StorageSlot.TransactionStorage storage txStorage = StorageSlot.getTransactionStorage();
    
    delete txStorage.actions;
    delete txStorage.returnedValues;

    aggregate(calls);

    bytes32 operationName = getOperation(keccak256(abi.encodePacked(txStorage.actions)));
    
    emit Operation(operationName, calls);

    delete txStorage.actions;
    delete txStorage.returnedValues;

    return operationName;
  }

  function aggregate(Call[] memory calls) internal {
    StorageSlot.TransactionStorage storage txStorage = StorageSlot.getTransactionStorage();

    for (uint256 current = 0; current < calls.length; current++) {
      bytes32 targetHash = calls[current].targetHash;
      address target = REGISTRY.getServiceAddress(targetHash);
      txStorage.actions.push(targetHash);
      target.execute(calls[current].callData);
    }
  }

  function getOperation(bytes32 operationHash) public view returns (bytes32) {
    return OPERATIONS_REGISTRY.getOperationName(operationHash);
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
   * @notice ERC3156 Flashloan Callback Handler. NOT to be called directly.
   * @dev This callback handler handles flashloan provided by Maker's Flashloan Provider.
   * Throws an error and reverts if there are not enough funds to refund the FL.
   * @param initiator Who initiated the flashloan. It the context of our contract this is the Proxy address of the user.
   * @param asset The address of the asset being flash loaned. It context of Maker's Flashloan, this is the DAI address.
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
    checkIfFlashloanIsInProgress();

    FlashloanData memory flData = abi.decode(data, (FlashloanData));

    address mcdFlash = CHAINLOG_VIEWER.getServiceAddress(MCD_FLASH);
    checkIfLenderIsTrusted(mcdFlash);
    checkIfFlashloanedAssetIsTheRequiredOne(asset, flData.asset);
    checkIfFlashloanedAmountIsTheRequiredOne(asset, flData.amount);
    processFlashloan(flData, initiator);
    uint256 paybackAmount = amount + fee;
    uint256 funds = IERC20(asset).balanceOf(address(this));
    if (funds < paybackAmount) {
      revert InsufficientFunds(funds, paybackAmount);
    }

    IERC20(asset).safeApprove(mcdFlash, paybackAmount);

    return ERC3156_FLASHLOAN_MSG;
  }

  /**
   * @notice Balancer Flashloan Provider handler. NOT to be called directly.
   * @dev Main used of this flashloan provider is on L2 Networks such as Optimism.
   * Also there are cases where a flashloan, in different than DAI asset, is needed.
   * Throws an error and reverts if there are not enough funds to refund the FL.
   * @param tokens Tokens used for the FL
   * @param amounts Flashloaned amounts of the corresponding tokens
   * @param feeAmounts Fee for each token's flashloaned amount
   * @param data Any calldata sent to the contract for execution later in the callback
   */
  function receiveFlashLoan(
    IERC20[] memory tokens,
    uint256[] memory amounts,
    uint256[] memory feeAmounts,
    bytes memory data
  ) external override {

    checkIfFlashloanIsInProgress();
    address asset = address(tokens[0]);
    (FlashloanData memory flData, address initiator) = abi.decode(
      data,
      (FlashloanData, address)
    );

    checkIfLenderIsTrusted(BALANCER_VAULT);
    checkIfFlashloanedAssetIsTheRequiredOne(asset, flData.asset);
    checkIfFlashloanedAmountIsTheRequiredOne(asset, flData.amount);

    processFlashloan(flData, initiator);

    uint256 paybackAmount = amounts[0] + feeAmounts[0];

    uint256 funds = IERC20(asset).balanceOf(address(this));
    if (funds < paybackAmount) {
      revert InsufficientFunds(funds, paybackAmount);
    }

    IERC20(asset).safeTransfer(BALANCER_VAULT, paybackAmount);
  }

  function checkIfLenderIsTrusted(address lender) public view {
    if (msg.sender != lender) revert UntrustedLender(msg.sender);
  }

  function checkIfFlashloanIsInProgress() private view {
    if (isFlashloanInProgress == 2) {
      revert FlashloanReentrancyAttempt();
    }
  }

  function checkIfFlashloanedAssetIsTheRequiredOne(
    address flashloaned,
    address required
  ) private pure {
    if (flashloaned != required) revert InconsistentAsset(flashloaned, required);
  }

  function checkIfFlashloanedAmountIsTheRequiredOne(
    address asset,
    uint256 requiredAmount
  ) private view {
    uint256 assetBalance = IERC20(asset).balanceOf(address(this));
    if (assetBalance < requiredAmount) revert InconsistentAmount(assetBalance, requiredAmount);
  }

  /**
   * @custom:scope The scope at which this method is execute is an external call. Our TakeFlashloan contract
   * calls a provider ( by an external call ) which calls a FL handler ( by an external call ).
   * Our contracts are meant to be execute in the context of a proxy hence is the need to call the proxy again
   * and pass the received amount.
   * @param flData In the context of this method it contains the amount that is flashloaned and that needs
   * to be send to the proxy. Also it contains further action calls that will be executed.
   * @param initiator The address of the proxy that initiated the flashloan
   */
  function processFlashloan(FlashloanData memory flData, address initiator) private {
    isFlashloanInProgress = 2;

    IERC20(flData.asset).safeTransfer(initiator, flData.amount);
    IProxy(payable(initiator)).execute(
      address(this),
      abi.encodeWithSelector(this.callbackAggregate.selector, flData.calls)
    );

    isFlashloanInProgress = 1;    
  }
}