// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../../actions/common/Executable.sol";
import { UseStorageSlot, StorageSlot, Read } from "../../UseStorageSlot.sol";
import { SafeERC20, IERC20 } from "../../../libs/SafeERC20.sol";
import { IWETH } from "../../../interfaces/tokens/IWETH.sol";
import { UnwrapEthData } from "../../../core/types/Common.sol";

/**
 * @title Unwrap ETH Action contract
 * @notice Unwraps WETH balances to ETH
 */
contract UnwrapEthV2 is Executable, UseStorageSlot {
  using SafeERC20 for IERC20;
  using Read for StorageSlot.TransactionStorage;

  IWETH immutable WETH;

  constructor(IWETH _weth) {
    WETH = _weth;
  }

  /**
   * @dev look at UseStore.sol to get additional info on paramsMapping
   * @param data Encoded calldata that conforms to the UnwrapEthData struct
   * @param paramsMap Maps operation storage values by index (index offset by +1) to execute calldata params
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    UnwrapEthData memory unwrapData = parseInputs(data);

    unwrapData.amount = store().readUint(bytes32(unwrapData.amount), paramsMap[0]);

    if (unwrapData.amount == type(uint256).max) {
      unwrapData.amount = WETH.balanceOf(address(this));
    }

    WETH.withdraw(unwrapData.amount);
  }

  function parseInputs(bytes memory _callData) public pure returns (UnwrapEthData memory params) {
    return abi.decode(_callData, (UnwrapEthData));
  }
}
