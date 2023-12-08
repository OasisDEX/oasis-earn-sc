// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { PullTokenData } from "../../core/types/Common.sol";
import "../../core/types/Common.sol";

/**
 * @title PullToken Action contract
 * @notice Pulls token from a target address to the current calling context
 */
contract PullToken is Executable {
  using SafeERC20 for IERC20;

  /**
   * @dev Is intended to pull tokens in to a user's proxy (the calling context)
   * @param data Encoded calldata that conforms to the PullTokenData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    PullTokenData memory pull = parseInputs(data);

    IERC20 token = IERC20(pull.asset);

    if (pull.amount == type(uint256).max) {
      pull.amount = token.balanceOf(pull.from);
    }
    token.safeTransferFrom(pull.from, address(this), pull.amount);
  }

  function parseInputs(bytes memory _callData) public pure returns (PullTokenData memory params) {
    return abi.decode(_callData, (PullTokenData));
  }
}
