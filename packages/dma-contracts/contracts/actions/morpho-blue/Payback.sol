// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { UseStore, Write, Read } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { PaybackData } from "../../core/types/MorphoBlue.sol";
import { MORPHO_BLUE } from "../../core/constants/MorphoBlue.sol";
import { IMorpho } from "../../interfaces/morpho-blue/IMorpho.sol";

/**
 * @title Payback | MorphoBlue Action contract
 * @notice Pays back a specified amount to Morpho Blue's lending pool
 */
contract MorphoBluePayback is Executable, UseStore {
  using Write for OperationStorage;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @dev Look at UseStore.sol to get additional info on paramsMapping.
   *
   * @param data Encoded calldata that conforms to the PaybackData struct
   * @param paramsMap Maps operation storage values by index (index offset by +1) to execute calldata params
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    PaybackData memory paybackData = parseInputs(data);

    paybackData.amount = store().readUint(bytes32(paybackData.amount), paramsMap[0], address(this));

    IMorpho morphoBlue = IMorpho(registry.getRegisteredService(MORPHO_BLUE));

    address onBehalf = paybackData.onBehalf == address(0) ? address(this) : paybackData.onBehalf;
    morphoBlue.repay(paybackData.marketParams, paybackData.amount, 0, onBehalf, bytes(""));

    store().write(bytes32(paybackData.amount));
  }

  function parseInputs(bytes memory _callData) public pure returns (PaybackData memory params) {
    return abi.decode(_callData, (PaybackData));
  }
}
