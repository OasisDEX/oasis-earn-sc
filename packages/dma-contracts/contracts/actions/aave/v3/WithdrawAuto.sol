// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../common/Executable.sol";
import { OperationStorage } from "../../../core/OperationStorage.sol";
import { ILendingPool } from "../../../interfaces/aave/ILendingPool.sol";
import { WithdrawData } from "../../../core/types/Aave.sol";
import { AAVE_POOL } from "../../../core/constants/Aave.sol";
import { IPoolV3 } from "../../../interfaces/aaveV3/IPoolV3.sol";
import { UseStorageSlot, StorageSlot, Write, Read } from "../../../libs/UseStorageSlot.sol";
import { UseRegistry } from "../../../libs/UseRegistry.sol";
import { ServiceRegistry } from "../../../core/ServiceRegistry.sol";

import "hardhat/console.sol";
/**
 * @title Withdraw | AAVE V3 Action contract
 * @notice Withdraw collateral from AAVE's lending pool
 */
contract AaveV3WithdrawAuto is Executable, UseStorageSlot, UseRegistry {
  using Write for StorageSlot.TransactionStorage;
  using Read for StorageSlot.TransactionStorage;

  constructor(address _registry) UseRegistry(ServiceRegistry(_registry)) {}

  /**
   * @param data Encoded calldata that conforms to the WithdrawData struct
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    WithdrawData memory withdraw = parseInputs(data);
    
    uint256 mappedWithdrawAmount = store().readUint(
      bytes32(0),
      paramsMap[0]
    );    

    uint256 amountWithdrawn = IPoolV3(getRegisteredService(AAVE_POOL)).withdraw(
      withdraw.asset,
      mappedWithdrawAmount,
      withdraw.to
    );

    store().write(bytes32(amountWithdrawn));
  }

  function parseInputs(bytes memory _callData) public pure returns (WithdrawData memory params) {
    return abi.decode(_callData, (WithdrawData));
  }
}

