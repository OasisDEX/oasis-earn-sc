//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.15;

import { OperationsRegistryColdHash } from "./OperationsRegistryColdHash.sol";
import { ServiceRegistry } from "../ServiceRegistry.sol";
import { ActionAddress } from "../../libs/ActionAddress.sol";
import { TakeFlashloan } from "../../actions/common/TakeFlashloan.sol";
import { Executable } from "../../actions/common/Executable.sol";
import { IERC3156FlashBorrower } from "../../interfaces/flashloan/IERC3156FlashBorrower.sol";
import { IERC3156FlashLender } from "../../interfaces/flashloan/IERC3156FlashLender.sol";
import { IFlashLoanRecipient } from "../../interfaces/flashloan/balancer/IFlashLoanRecipient.sol";
import { IDSProxy } from "../../interfaces/ds/IDSProxy.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { SafeMath } from "../../libs/SafeMath.sol";
import { FlashloanData, Call } from "../types/Common.sol";
import {
  OPERATION_STORAGE,
  OPERATIONS_REGISTRY,
  OPERATION_EXECUTOR
} from "../constants/Common.sol";
import { FLASH_MINT_MODULE } from "../constants/Maker.sol";
import { BALANCER_VAULT } from "../constants/Balancer.sol";

error UntrustedLender(address lender);
error InconsistentAsset(address flashloaned, address required);
error InconsistentAmount(uint256 flashloaned, uint256 required);

library StorageSlot {
  struct TransactionStorage {
    bytes actions;
  }

  function getTransactionStorage() internal pure returns (TransactionStorage storage r) {
    assembly {
      r.slot := 0x1337
    }
  }
}

interface IOperationStorage {
  function setInitiator(address) external;
}

/**
 * @title Operation Executor
 * @notice Is responsible for executing sequences of Actions (Operations)
 */

contract OperationExecutorStorageSlot is IERC3156FlashBorrower, IFlashLoanRecipient {
  using ActionAddress for address;
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  ServiceRegistry public immutable registry;

  /**
   * @dev Emitted once an Operation has completed execution
   * @param name The address initiating the deposit
   * @param calls An array of Action calls the operation must execute
   **/
  event Operation(bytes32 indexed name, Call[] calls);

  constructor(ServiceRegistry _registry) {
    registry = _registry;
  }

  function executeOp(Call[] memory calls) public payable {
    StorageSlot.TransactionStorage storage txStorage = StorageSlot.getTransactionStorage();
    OperationsRegistryColdHash opRegistry = OperationsRegistryColdHash(
      registry.getRegisteredService(OPERATIONS_REGISTRY)
    );
    txStorage.actions = "";
    aggregate(calls);
    bytes32 opHash = keccak256(txStorage.actions);
    require(opRegistry.isWhitelisted(opHash), "inconsistent-execution");
    txStorage.actions = "";
    // By packing the string into bytes32 which means the max char length is capped at 64
    emit Operation(opHash, calls);
  }

  function aggregate(Call[] memory calls) internal {
    StorageSlot.TransactionStorage storage txStorage = StorageSlot.getTransactionStorage();
    for (uint256 current = 0; current < calls.length; current++) {
      bytes32 targetHash = calls[current].targetHash;
      address target = registry.getServiceAddress(targetHash);
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
    require(
      msg.sender == registry.getRegisteredService(OPERATION_EXECUTOR),
      "OpExecutor: Caller forbidden"
    );
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
    address lender = registry.getRegisteredService(FLASH_MINT_MODULE);
    checkIfLenderIsTrusted(lender);
    checkIfFlashloanedAssetIsTheRequiredOne(asset, flData.asset);
    checkIfFlashloanedAmountIsTheRequiredOne(asset, flData.amount);

    processFlashloan(flData, initiator);

    uint256 paybackAmount = amount.add(fee);
    require(
      IERC20(asset).balanceOf(address(this)) >= paybackAmount,
      "Insufficient funds for payback"
    );
    IERC20(asset).safeApprove(lender, paybackAmount);
    return keccak256("ERC3156FlashBorrower.onFlashLoan");
  }

  function receiveFlashLoan(
    IERC20[] memory tokens,
    uint256[] memory amounts,
    uint256[] memory feeAmounts,
    bytes memory data
  ) external override {
    address asset = address(tokens[0]);
    address lender = registry.getRegisteredService(BALANCER_VAULT);
    (FlashloanData memory flData, address initiator) = abi.decode(data, (FlashloanData, address));

    checkIfLenderIsTrusted(lender);
    checkIfFlashloanedAssetIsTheRequiredOne(asset, flData.asset);
    checkIfFlashloanedAmountIsTheRequiredOne(asset, flData.amount);

    processFlashloan(flData, initiator);

    uint256 paybackAmount = amounts[0].add(feeAmounts[0]);

    require(
      IERC20(asset).balanceOf(address(this)) >= paybackAmount,
      "Insufficient funds for payback"
    );

    IERC20(asset).safeTransfer(lender, paybackAmount);
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
    if (flData.isProxyFlashloan) {
      IERC20(flData.asset).safeTransfer(initiator, flData.amount);
      IDSProxy(payable(initiator)).execute(
        address(this),
        abi.encodeWithSelector(this.callbackAggregate.selector, flData.calls)
      );
    } else {
      IOperationStorage opStorage = IOperationStorage(
        registry.getRegisteredService(OPERATION_STORAGE)
      );
      opStorage.setInitiator(initiator);
      aggregate(flData.calls);
    }
  }
}