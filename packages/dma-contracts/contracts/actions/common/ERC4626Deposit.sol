// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { UseStore, Write, Read } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { ERC4626DepositData } from "../../core/types/Common.sol";
import { IERC4626 } from "@openzeppelin/contracts/interfaces/IERC4626.sol";

/**
 * @title Deposit | Morpho Blue Action contract
 * @notice Deposits the specified asset as collateral on MorphoBlue's lending pool
 */
contract ERC4626Deposit is Executable, UseStore {
  using Write for OperationStorage;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @dev Look at UseStore.sol to get additional info on paramsMapping
   *
   * @param data Encoded calldata that conforms to the DepositData struct
   * @param paramsMap Maps operation storage values by index (index offset by +1) to execute calldata params
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    ERC4626DepositData memory depositData = parseInputs(data);

    uint256 mappedDepositAmount = store().readUint(
      bytes32(depositData.amount),
      paramsMap[1],
      address(this)
    );

    IERC4626 vault = IERC4626(depositData.vault);
    vault.deposit(mappedDepositAmount, address(this));

    store().write(bytes32(mappedDepositAmount));
  }

  function parseInputs(
    bytes memory _callData
  ) public pure returns (ERC4626DepositData memory params) {
    return abi.decode(_callData, (ERC4626DepositData));
  }
}
