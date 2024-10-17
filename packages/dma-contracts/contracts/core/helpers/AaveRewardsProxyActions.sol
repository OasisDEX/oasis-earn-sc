// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.10;

import { IRewardsController } from "../../interfaces/aaveV3/IRewardsController.sol";
import { console } from "hardhat/console.sol";

interface IDataProvider {
  function getReserveTokensAddresses(
    address asset
  ) external view returns (address, address, address);
}

/**
 * @title RewardsControllerProxyActions
 * @dev A contract that provides helper functions for interacting with RewardsController through a proxy.
 */
contract AaveRewardsProxyActions {
  /**
   * @dev Claims rewards for the specified assets and amount.
   * @param _rewardsController The address of the RewardsController contract.
   * @param _assets List of asset addresses.
   * @param _amount Amount of rewards to claim.
   * @param _reward Address of the reward token.
   * @return claimed The amount of rewards claimed.
   */
  function claimRewards(
    address _rewardsController,
    address[] calldata _assets,
    uint256 _amount,
    address _reward
  ) external returns (uint256 claimed) {
    claimed = IRewardsController(_rewardsController).claimRewards(
      _assets,
      _amount,
      msg.sender,
      _reward
    );
    return claimed;
  }

  /**
   * @dev Claims all rewards for the specified assets.
   * @param _rewardsController The address of the RewardsController contract.
   * @param _assets List of asset addresses.
   * @return rewardsList List of reward token addresses.
   * @return claimedAmounts List of claimed amounts corresponding to each reward token.
   */
  function claimAllRewards(
    address _rewardsController,
    address[] calldata _assets
  ) external returns (address[] memory rewardsList, uint256[] memory claimedAmounts) {
    return IRewardsController(_rewardsController).claimAllRewards(_assets, msg.sender);
  }

  /**
   * @dev Gets all user rewards for the specified assets.
   * @param _rewardsController The address of the RewardsController contract.
   * @param _dataProvider The address of the DataProvider contract.
   * @param _user The address of the user.
   * @param _token The address of the token.
   * @return rewardsList List of reward token addresses.
   * @return unclaimedAmounts List of unclaimed amounts corresponding to each reward token.
   * @dev This function is used to get all user rewards for the specified assets.
   * @dev The function first gets the reserve tokens addresses for the specified token.
   * @dev Then it creates an array of assets with the aToken and variableDebtToken.
   * @dev Finally, it calls the getAllUserRewards function from the RewardsController contract.
   */
  function getAllUserRewards(
    address _rewardsController,
    address _dataProvider,
    address _user,
    address _token
  ) external view returns (address[] memory rewardsList, uint256[] memory unclaimedAmounts, address[] memory assets) {
    IDataProvider dataProvider = IDataProvider(_dataProvider);
    (address aToken, , address variableDebtToken) = dataProvider.getReserveTokensAddresses(_token);
    assets = new address[](2);
    assets[0] = aToken;
    assets[1] = variableDebtToken;
    (rewardsList, unclaimedAmounts) = IRewardsController(_rewardsController).getAllUserRewards(assets, _user);
  }
}
