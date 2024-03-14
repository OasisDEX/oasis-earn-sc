// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { ClaimMultipleRewardsData } from "../../core/types/MorphoBlue.sol";
import {
  IUniversalRewardsDistributorBase
} from "../../interfaces/morpho-blue/IUniversalRewardsDistributorBase.sol";

/**
 * @title ClaimMultipleTokens Action contract
 * @notice Claims multiple rewards from MorphoBlue and sends them to the owner's EOA
 */
contract MorphoBlueClaimRewards is Executable {
  /**
   * @param data Encoded calldata that conforms to the ClaimMultipleRewardsData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    ClaimMultipleRewardsData memory claimData = abi.decode(data, (ClaimMultipleRewardsData));
    require(
      claimData.claimable.length == claimData.rewards.length &&
        claimData.rewards.length == claimData.urd.length &&
        claimData.urd.length == claimData.proofs.length,
      "MorphoBlueClaimRewards - Array lengths must be equal"
    );
    for (uint256 i = 0; i < claimData.rewards.length; i++) {
      /**
       * @dev Calls the `claim` function of the `IUniversalRewardsDistributorBase` contract to claim rewards.
       * @param claimData.urd[i] The address of the rewards distributor to claim from.
       * @param claimData.rewards[i] The address of the rewards token to claim.
       * @param claimData.claimable[i] The amount of rewards to claim.
       * @param claimData.proofs[i] The Merkle proof to claim the rewards.
       * @param address(this) The address of the contract claiming the rewards - DPM proxy.
       */
      IUniversalRewardsDistributorBase(claimData.urd[i]).claim(
        address(this),
        claimData.rewards[i],
        claimData.claimable[i],
        claimData.proofs[i]
      );
    }
  }
}
