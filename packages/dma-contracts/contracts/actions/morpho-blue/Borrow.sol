// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { Write, UseStore } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { BorrowData } from "../../core/types/MorphoBlue.sol";
import { MORPHO_BLUE } from "../../core/constants/MorphoBlue.sol";
import { IMorpho } from "../../interfaces/morpho-blue/IMorpho.sol";

/**
 * @title Borrow | Morpho Blue Action contract
 * @notice Borrows token from MorphoBlue's lending pool
 */
contract MorphoBlueBorrow is Executable, UseStore {
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @dev Look at UseStore.sol to get additional info on paramsMapping
   *
   * @param data Encoded calldata that conforms to the BorrowData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    BorrowData memory borrowData = parseInputs(data);

    IMorpho morphoBlue = IMorpho(registry.getRegisteredService(MORPHO_BLUE));
    morphoBlue.borrow(borrowData.marketParams, borrowData.amount, 0, address(this), address(this));

    store().write(bytes32(borrowData.amount));
  }

  function parseInputs(bytes memory _callData) public pure returns (BorrowData memory params) {
    return abi.decode(_callData, (BorrowData));
  }
}
