// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../../actions/common/Executable.sol";
import { UseStorageSlot, StorageSlot, Write, Read } from "../../UseStorageSlot.sol";
import { IPoolV3 } from "../../../interfaces/aaveV3/IPoolV3.sol";
import { DepositData } from "../../../core/types/Aave.sol";
import { SafeMath } from "../../../libs/SafeMath.sol";

/**
 * @title Deposit | AAVE V3 Action contract
 * @notice Deposits the specified asset as collateral on AAVE's lending pool
 */
contract AaveV3DepositV2 is Executable, UseStorageSlot {
  using Write for StorageSlot.TransactionStorage;
  using Read for StorageSlot.TransactionStorage;
  using SafeMath for uint256;

  IPoolV3 immutable AAVE_POOL;

  constructor(address _aavePool) {
    AAVE_POOL = IPoolV3(_aavePool);
  }

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

    AAVE_POOL.supply(deposit.asset, actualDepositAmount, address(this), 0);

    if (deposit.setAsCollateral) {
      AAVE_POOL.setUserUseReserveAsCollateral(deposit.asset, true);
    }

    store().write(bytes32(actualDepositAmount));
  }

  function parseInputs(bytes memory _callData) public pure returns (DepositData memory params) {
    return abi.decode(_callData, (DepositData));
  }
}
