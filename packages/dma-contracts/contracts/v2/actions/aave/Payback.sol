// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../../actions/common/Executable.sol";
import { UseStorageSlot, StorageSlot, Write, Read } from "../../UseStorageSlot.sol";
import { IVariableDebtToken } from "../../../interfaces/aave/IVariableDebtToken.sol";
import { IWETHGateway } from "../../../interfaces/aave/IWETHGateway.sol";
import { PaybackData } from "../../../core/types/Aave.sol";
import { ILendingPool } from "../../../interfaces/aave/ILendingPool.sol";
import { IPoolV3 } from "../../../interfaces/aaveV3/IPoolV3.sol";

/**
 * @title Payback | AAVE V3 Action contract
 * @notice Pays back a specified amount to AAVE's lending pool
 */
contract AaveV3PaybackV2 is Executable, UseStorageSlot {
  using Write for StorageSlot.TransactionStorage;
  using Read for StorageSlot.TransactionStorage;

  IPoolV3 immutable AAVE_POOL;

  constructor(address _aavePool) {
    AAVE_POOL = IPoolV3(_aavePool);
  }

  /**
   * @dev Look at UseStore.sol to get additional info on paramsMapping.
   * @dev The paybackAll flag - when passed - will signal the user wants to repay the full debt balance for a given asset
   * @param data Encoded calldata that conforms to the PaybackData struct
   * @param paramsMap Maps operation storage values by index (index offset by +1) to execute calldata params
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    PaybackData memory payback = parseInputs(data);

    payback.amount = store().readUint(bytes32(payback.amount), paramsMap[1]);

    AAVE_POOL.repay(
      payback.asset,
      payback.paybackAll ? type(uint256).max : payback.amount,
      2,
      address(this)
    );

    store().write(bytes32(payback.amount));
  }

  function parseInputs(bytes memory _callData) public pure returns (PaybackData memory params) {
    return abi.decode(_callData, (PaybackData));
  }
}
