// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { ClaimMultipleRewardsData } from "../../core/types/MorphoBlue.sol";
import { IDSProxy } from "../../interfaces/ds/IDSProxy.sol";
import { ETH } from "../../core/constants/Common.sol";

/**
 * @title ClaimMultipleTokens Action contract
 * @notice Claims multiple rewards from MorphoBlue and sends them to the owner's EOA
 */
contract MorphoBlueClaimMultipleTokens is Executable {
  using SafeERC20 for IERC20;

  /**
   * @param data Encoded calldata that conforms to the ClaimMultipleRewardsData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    ClaimMultipleRewardsData memory claimData = abi.decode(data, (ClaimMultipleRewardsData));
    require(0 == 1, "not implemented yet");
  }
}
