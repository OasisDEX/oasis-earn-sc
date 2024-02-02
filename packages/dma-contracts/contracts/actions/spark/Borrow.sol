// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { Read, Write, UseStore } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { BorrowData } from "../../core/types/Spark.sol";
import { SPARK_LENDING_POOL } from "../../core/constants/Spark.sol";
import { IPool } from "../../interfaces/spark/IPool.sol";

/**
 * @title Borrow | Spark Action contract
 * @notice Borrows tokens from Spark's lending pool
 */
contract SparkBorrow is Executable, UseStore {
  using Write for OperationStorage;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @param data Encoded calldata that conforms to the BorrowData struct
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    BorrowData memory borrow = parseInputs(data);

    uint256 mappedBorrowAmount = store().readUint(
      bytes32(borrow.amount),
      paramsMap[1],
      address(this)
    );

    IPool(registry.getRegisteredService(SPARK_LENDING_POOL)).borrow(
      borrow.asset,
      mappedBorrowAmount,
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
