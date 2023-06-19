// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../../actions/common/Executable.sol";
import { UseStorageSlot, StorageSlot, Write, Read } from "../../UseStorageSlot.sol";
import { ILendingPool } from "../../../interfaces/aave/ILendingPool.sol";
import { WithdrawData } from "../../../core/types/Aave.sol";
import { IPoolV3 } from "../../../interfaces/aaveV3/IPoolV3.sol";

/**
 * @title Withdraw | AAVE V3 Action contract
 * @notice Withdraw collateral from AAVE's lending pool
 */
contract AaveV3WithdrawV2 is Executable, UseStorageSlot {
  using Write for StorageSlot.TransactionStorage;

  IPoolV3 immutable AAVE_POOL;

  constructor(address _aavePool) {
    AAVE_POOL = IPoolV3(_aavePool);
  }

  /**
   * @param data Encoded calldata that conforms to the WithdrawData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    WithdrawData memory withdraw = parseInputs(data);

    uint256 amountWithdrawn = AAVE_POOL.withdraw(withdraw.asset, withdraw.amount, withdraw.to);

    store().write(bytes32(amountWithdrawn));
  }

  function parseInputs(bytes memory _callData) public pure returns (WithdrawData memory params) {
    return abi.decode(_callData, (WithdrawData));
  }
}
