// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { ReturnMultipleTokensData } from "../../core/types/Common.sol";
import { IDSProxy } from "../../interfaces/ds/IDSProxy.sol";
import { ETH } from "../../core/constants/Common.sol";

/**
 * @title ReturnMultipleTokens Action contract
 * @notice Returns multiple tokens  and/or ETH sitting on a user's proxy to a user's EOA
 */
contract ReturnMultipleTokens is Executable {
  using SafeERC20 for IERC20;

  /**
   * @param data Encoded calldata that conforms to the ReturnFundsData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    ReturnMultipleTokensData memory returnData = abi.decode(
      data,
      (ReturnMultipleTokensData)
    );
    address[] memory tokens = returnData.assets;
    address owner = IDSProxy(payable(address(this))).owner();
    uint256 amount;

    for (uint256 i = 0; i < tokens.length; i++) {
      if (tokens[i] == ETH) {
        amount = address(this).balance;
        payable(owner).transfer(amount);
      } else {
        amount = IERC20(tokens[i]).balanceOf(address(this));
        IERC20(tokens[i]).safeTransfer(owner, amount);
      }
    }
  }
}
