// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../../actions/common/Executable.sol";
import { UseStorageSlot, StorageSlot, Write } from "../../UseStorageSlot.sol";
import { SafeERC20, IERC20 } from "../../../libs/SafeERC20.sol";
import { SwapData } from "../../../core/types/Common.sol";
import { Swap } from "../../../swap/Swap.sol";

/**
 * @title SwapAction Action contract
 * @notice Call the deployed Swap contract which handles swap execution
 */
contract SwapActionV2 is Executable, UseStorageSlot {
  using SafeERC20 for IERC20;
  using Write for StorageSlot.TransactionStorage;

  Swap immutable SWAP;

  constructor(address _swap) {
    SWAP = Swap(_swap);
  }

  /**
   * @dev The swap contract is pre-configured to use a specific exchange (EG 1inch)
   * @param data Encoded calldata that conforms to the SwapData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    SwapData memory swap = parseInputs(data);

    IERC20(swap.fromAsset).safeApprove(address(SWAP), swap.amount);

    uint256 received = SWAP.swapTokens(swap);

    store().write(bytes32(received));
  }

  function parseInputs(bytes memory _callData) public pure returns (SwapData memory params) {
    return abi.decode(_callData, (SwapData));
  }
}
