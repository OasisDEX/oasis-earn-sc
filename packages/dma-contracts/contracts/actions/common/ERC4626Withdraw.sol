// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { UseStore, Write, Read } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { ERC4626WithdrawData } from "../../core/types/Common.sol";
import { IERC4626 } from "@openzeppelin/contracts/interfaces/IERC4626.sol";

/**
 * @title Withdraw | Morpho Blue Action contract
 * @notice Withdraws the specified asset as collateral on MorphoBlue's lending pool
 */
contract ERC4626Withdraw is Executable, UseStore {
  using Write for OperationStorage;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @dev Look at UseStore.sol to get additional info on paramsMapping
   *
   * @param data Encoded calldata that conforms to the WithdrawData struct
   * @param paramsMap Maps operation storage values by index (index offset by +1) to execute calldata params
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    ERC4626WithdrawData memory depositData = parseInputs(data);

    uint256 mappedWithdrawAmount = store().readUint(
      bytes32(depositData.amount),
      paramsMap[1],
      address(this)
    );
    IERC4626 vault = IERC4626(depositData.vault);

    if (depositData.amount == type(uint256).max) {
      uint256 maxReedemable = vault.maxRedeem(address(this));
      vault.redeem(maxReedemable, address(this), address(this));
    } else {
      vault.withdraw(mappedWithdrawAmount, address(this), address(this));
    }

    store().write(bytes32(mappedWithdrawAmount));
  }

  function parseInputs(
    bytes memory _callData
  ) public pure returns (ERC4626WithdrawData memory params) {
    return abi.decode(_callData, (ERC4626WithdrawData));
  }
}
