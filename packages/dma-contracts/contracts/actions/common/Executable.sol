// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

/**
 * @title Shared Action Executable interface
 * @notice Provides a dma-common interface for an execute method to all Action
 */
interface Executable {
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable;
}
