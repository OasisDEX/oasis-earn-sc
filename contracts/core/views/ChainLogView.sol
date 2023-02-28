//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.15;

import { IChainLog } from "../../interfaces/maker/IChainLog.sol";
/**
 * @title ChainLogView
 * @notice Reads the Chainlog contract to get the address of a service by its name
 */
contract ChainLogView {
  address public immutable chainlogAddress;

  constructor(address _chainlogAddress) {
    chainlogAddress = _chainlogAddress;
  }

  /**
   * @notice Gets the address of a service by its name
   * @param serviceName The name of the service
   * @return The address of the service
   */

  function getServiceAddress(string calldata serviceName) public view returns (address) {
    bytes32 serviceHash = bytes32(abi.encodePacked(serviceName));
    return IChainLog(chainlogAddress).getAddress(serviceHash);
  }

  /**
   * @notice Gets the address of a join adapter by its ilk name
   * @param ilkName The name of the ilk
   * @return The address of the join adapter
   */
  function getIlkJoinAddressByName(string calldata ilkName) public view returns (address) {
    bytes32 ilkHash = bytes32(abi.encodePacked("MCD_JOIN_", ilkName));
    return IChainLog(chainlogAddress).getAddress(ilkHash);
  }
}
