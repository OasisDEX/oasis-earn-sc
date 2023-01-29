// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { UseStore, Write } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { ILendingPool } from "../../interfaces/aave/ILendingPool.sol";
import { WithdrawData } from "../../core/types/Aave.sol";
import { AAVE_LENDING_POOL, WITHDRAW_ACTION } from "../../core/constants/Aave.sol";
import { IPoolV3 } from "../../interfaces/aaveV3/IPoolV3.sol";

import "hardhat/console.sol";
/**
 * @title Withdraw | AAVE Action contract
 * @notice Withdraw collateral from AAVE's lending pool
 */
contract AaveV3Withdraw is Executable, UseStore {
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @param data Encoded calldata that conforms to the WithdrawData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    WithdrawData memory withdraw = parseInputs(data);

    console.log('WITHDRAWIN' );
    
    uint256 amountWithdrawn = IPoolV3(0x7b5C526B7F8dfdff278b4a3e045083FBA4028790)
      .withdraw(withdraw.asset, withdraw.amount, withdraw.to);

    store().write(bytes32(amountWithdrawn));

    emit Action(WITHDRAW_ACTION, bytes(abi.encode(amountWithdrawn)));
  }

  function parseInputs(bytes memory _callData) public pure returns (WithdrawData memory params) {
    return abi.decode(_callData, (WithdrawData));
  }
}
