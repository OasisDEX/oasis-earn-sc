// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.15;

interface IRewardsController {
  function claimRewards(
    address[] calldata assets,
    uint256 amount,
    address to,
    address reward
  ) external returns (uint256);

  function claimRewardsOnBehalf(
    address[] calldata assets,
    uint256 amount,
    address user,
    address to,
    address reward
  ) external returns (uint256);

  function claimRewardsToSelf(
    address[] calldata assets,
    uint256 amount,
    address reward
  ) external returns (uint256);

  function claimAllRewards(
    address[] calldata assets,
    address to
  ) external returns (address[] memory rewardsList, uint256[] memory claimedAmounts);

  function claimAllRewardsOnBehalf(
    address[] calldata assets,
    address user,
    address to
  ) external returns (address[] memory rewardsList, uint256[] memory claimedAmounts);

  function claimAllRewardsToSelf(
    address[] calldata assets
  ) external returns (address[] memory rewardsList, uint256[] memory claimedAmounts);

  function getAllUserRewards(
    address[] calldata assets,
    address user
  ) external view returns (address[] memory rewardsList, uint256[] memory unclaimedAmounts);
}
