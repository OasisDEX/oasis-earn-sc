// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.15;

import { IERC20 } from "../libs/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

/**
 * @title Rewards Redeemer Implementation
 * @notice
 * @dev
 */
contract RewardsRedeemerImplementation is AccessControl, Initializable {
  bytes32 public constant PARTNER_ROLE = keccak256("PARTNER_ROLE");

  function initialize(address partner) public initializer {
    _setupRole(PARTNER_ROLE, partner);
  }

  // TODO: add storing merle tree and claiming rewards logic
  function claimReward() public {
    //TODO: verify merkle proof implementation and send  reward tokens to user
  }

  function withdrawTokens(address token, address to, uint256 amount) external {
    require(hasRole(PARTNER_ROLE, msg.sender), "Caller is not a partner");
    IERC20(token).transfer(to, amount);
  }
}
