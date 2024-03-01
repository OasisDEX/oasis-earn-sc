// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { Write, UseStore } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { IERC20 } from "../../libs/SafeERC20.sol";
import { TokenBalanceData } from "../../core/types/Common.sol";

/**
 * @title TokenBalance Action contract
 * @notice Reads balance of a token for a given address
 */
contract TokenBalance is Executable, UseStore {
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @dev Is intended to read token balance for a given address
   * @param data Encoded calldata that conforms to the TokenBalanceData struct
   */

  function execute(bytes calldata data, uint8[] memory) external payable override {
    TokenBalanceData memory read = parseInputs(data);

    uint256 balance = IERC20(read.asset).balanceOf(read.owner);

    store().write(bytes32(balance));
  }

  function parseInputs(
    bytes memory _callData
  ) public pure returns (TokenBalanceData memory params) {
    return abi.decode(_callData, (TokenBalanceData));
  }
}
