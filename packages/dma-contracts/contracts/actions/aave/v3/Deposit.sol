// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../common/Executable.sol";
import { UseStorageSlot, StorageSlot, Write, Read } from "../../../libs/UseStorageSlot.sol";
import { ServiceRegistry } from "../../../core/ServiceRegistry.sol";
import { IPoolV3 } from "../../../interfaces/aaveV3/IPoolV3.sol";
import { DepositData } from "../../../core/types/Aave.sol";
import { SafeMath } from "../../../libs/SafeMath.sol";
import { AAVE_POOL } from "../../../core/constants/Aave.sol";
import { UseRegistry } from "../../../libs/UseRegistry.sol";

/**
 * @title Deposit | AAVE V3 Action contract
 * @notice Deposits the specified asset as collateral on AAVE's lending pool
 */
contract AaveV3Deposit is Executable, UseStorageSlot, UseRegistry {
  using Write for StorageSlot.TransactionStorage;
  using Read for StorageSlot.TransactionStorage;
  using SafeMath for uint256;

  constructor(address _registry) UseRegistry(ServiceRegistry(_registry)) {}
  

  /**
   * @dev Look at UseStore.sol to get additional info on paramsMapping
   * @param data Encoded calldata that conforms to the DepositData struct
   * @param paramsMap Maps operation storage values by index (index offset by +1) to execute calldata params
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    DepositData memory deposit = parseInputs(data);

    uint256 mappedDepositAmount = store().readUint(bytes32(deposit.amount), paramsMap[1]);

    uint256 actualDepositAmount = deposit.sumAmounts
      ? mappedDepositAmount.add(deposit.amount)
      : mappedDepositAmount;

    IPoolV3(getRegisteredService(AAVE_POOL)).supply(
      deposit.asset,
      actualDepositAmount,
      address(this),
      0
    );

    if (deposit.setAsCollateral) {
      IPoolV3(getRegisteredService(AAVE_POOL)).setUserUseReserveAsCollateral(
        deposit.asset,
        true
      );
    }

    store().write(bytes32(actualDepositAmount));
  }

  function parseInputs(bytes memory _callData) public pure returns (DepositData memory params) {
    return abi.decode(_callData, (DepositData));
  }
}
