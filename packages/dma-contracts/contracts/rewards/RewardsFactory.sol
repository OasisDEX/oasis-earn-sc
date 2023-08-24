// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.15;

// Uncomment this line to use console.log

import "hardhat/console.sol";

import { RewardsRedeemerImplementation } from "./RewardsRedeemerImplementation.sol";
import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Rewards Factory
 * @notice Allows to create new Rewards Redeemer contracts by partners.
 * @dev Partner as a msg.sender has to have PARTNER_ROLE to create new Rewards Redeemer contract.
 * Admin role is used to manage PARTNER_ROLE.
 */
contract RewardsFactory is AccessControl {
  address public immutable rewardsRedeemerTemplate;

  bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
  bytes32 public constant PARTNER_ROLE = keccak256("PARTNER_ROLE");

  mapping(address => address) public redeemers;

  constructor() {
    _setupRole(ADMIN_ROLE, msg.sender);
    address addr = address(new RewardsRedeemerImplementation());
    rewardsRedeemerTemplate = addr;
  }

  function addPartner(address partner) public {
    require(hasRole(ADMIN_ROLE, msg.sender), "RewardsFactory: Caller is not an admin");
    _grantRole(PARTNER_ROLE, partner);
  }

  function removePartner(address partner) public {
    require(hasRole(ADMIN_ROLE, msg.sender), "RewardsFactory: Caller is not an admin");
    _revokeRole(PARTNER_ROLE, partner);
  }

  function createRewardsRedeemer() external returns (address) {
    require(hasRole(PARTNER_ROLE, msg.sender), "RewardsFactory: Caller is not a partner");

    address clone = Clones.clone(rewardsRedeemerTemplate);
    RewardsRedeemerImplementation(clone).initialize(msg.sender);
    redeemers[msg.sender] = clone;
    emit RewardsRedeemerCreated(clone, msg.sender);

    return clone;
  }

  event RewardsRedeemerCreated(address indexed rewardsRedeemer, address indexed partner);
}
