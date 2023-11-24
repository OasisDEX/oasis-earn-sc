// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../common/Executable.sol";
import { UseStorageSlot, StorageSlot, Write, Read } from "../../../libs/UseStorageSlot.sol";
import { UseStore } from "../../common/UseStore.sol";
import { ServiceRegistry } from "../../../core/ServiceRegistry.sol";
import { IVariableDebtToken } from "../../../interfaces/aave/IVariableDebtToken.sol";
import { IWETHGateway } from "../../../interfaces/aave/IWETHGateway.sol";
import { ILendingPool } from "../../../interfaces/aave/ILendingPool.sol";
import { BorrowData } from "../../../core/types/Aave.sol";
import { AAVE_POOL } from "../../../core/constants/Aave.sol";
import { IPoolV3 } from "../../../interfaces/aaveV3/IPoolV3.sol";

/**
 * @title Borrow | AAVE V3 Action contract
 * @notice Borrows token from AAVE's lending pool
 */
contract AaveV3Borrow is Executable, UseStorageSlot {
  using Write for StorageSlot.TransactionStorage;

  ServiceRegistry internal immutable registry;

  constructor(address _registry) {
    registry = ServiceRegistry(_registry);
  }
  
  /**
   * @param data Encoded calldata that conforms to the BorrowData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    BorrowData memory borrow = parseInputs(data);

    IPoolV3(registry.getRegisteredService(AAVE_POOL)).borrow(
      borrow.asset,
      borrow.amount,
      2,
      0,
      address(this)
    );

    store().write(bytes32(borrow.amount));
  }

  function parseInputs(bytes memory _callData) public pure returns (BorrowData memory params) {
    return abi.decode(_callData, (BorrowData));
  }
}
