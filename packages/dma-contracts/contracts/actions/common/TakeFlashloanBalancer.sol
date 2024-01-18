// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { ServiceRegistry } from "../../core/ServiceRegistry.sol";
import { IVault } from "../../interfaces/balancer/IVault.sol";
import { IProtocolFeesCollector } from "../../interfaces/balancer/IProtocolFeesCollector.sol";
import { IERC3156FlashBorrower } from "../../interfaces/flashloan/IERC3156FlashBorrower.sol";
import { IERC3156FlashLender } from "../../interfaces/flashloan/IERC3156FlashLender.sol";
import { IFlashLoanRecipient } from "../../interfaces/flashloan/balancer/IFlashLoanRecipient.sol";
import { FlashloanData, FlashloanProvider } from "../../core/types/Common.sol";
import { OPERATION_EXECUTOR, DAI, CHAINLOG_VIEWER } from "../../core/constants/Common.sol";
import { BALANCER_VAULT } from "../../core/constants/Balancer.sol";
import { ProxyPermission } from "../../libs/DS/ProxyPermission.sol";
import { IERC20 } from "../../libs/SafeERC20.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import "../../libs/FixedPoint.sol";
import { UseStorageSlot, StorageSlot, Write, Read } from "../../libs/UseStorageSlot.sol";
import { UseRegistry } from "../../libs/UseRegistry.sol";
import "hardhat/console.sol";

/**
 * @title TakeFlashloanBalancer Action contract
 * @notice Executes a sequence of Actions after flashloaning funds
 */
contract TakeFlashloanBalancer is Executable, ProxyPermission, UseStorageSlot, UseRegistry {
  address internal immutable dai;
  using Write for StorageSlot.TransactionStorage;

  constructor(
    address _registry,
    address _dai,
    address _dsGuardFactory
  ) ProxyPermission(_dsGuardFactory) UseRegistry(ServiceRegistry(_registry)) {
    dai = _dai;
  }

  /**
   * @dev When the Flashloan lender calls back the Operation Executor we may need to re-establish the calling context.
   * @dev The isProxyFlashloan flag is used to give the Operation Executor temporary authority to call the execute method on a user"s proxy. Refers to any proxy wallet (DSProxy or DPMProxy at time of writing)
   * @dev isDPMProxy flag switches between regular DSPRoxy and DPMProxy
   * @param data Encoded calldata that conforms to the FlashloanData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    FlashloanData memory flData = parseInputs(data);
    address operationExecutorAddress = getRegisteredService(OPERATION_EXECUTOR);

    givePermission(flData.isDPMProxy, operationExecutorAddress);

    IERC20[] memory tokens = new IERC20[](1);
    uint256[] memory amounts = new uint256[](1);

    tokens[0] = IERC20(flData.asset);
    amounts[0] = flData.amount;

    uint256 feePercentage = IProtocolFeesCollector(
      IVault(getRegisteredService(BALANCER_VAULT)).getProtocolFeesCollector()
    ).getFlashLoanFeePercentage();

    uint256 fullFlashloanAmount = amounts[0] + FixedPoint.mulUp(amounts[0], feePercentage);
    store().write(bytes32(fullFlashloanAmount));

    IVault(getRegisteredService(BALANCER_VAULT)).flashLoan(
      IFlashLoanRecipient(operationExecutorAddress),
      tokens,
      amounts,
      abi.encode(flData, address(this))
    );

    removePermission(flData.isDPMProxy, operationExecutorAddress);
  }

  function parseInputs(bytes memory _callData) public pure returns (FlashloanData memory params) {
    return abi.decode(_callData, (FlashloanData));
  }
}
