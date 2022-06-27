// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import "../../interfaces/maker/IJoin.sol";
import "../../interfaces/maker/IManager.sol";

import "hardhat/console.sol";

contract CdpDisallow {
  function executeAction(
    bytes[] memory _callData,
    uint256[] memory _paramsMapping,
    bytes32[] memory _returnValues
  ) public payable returns (bytes32) {
    (address mcdManager, address flashloanProvider) = parseInputs(_callData);

    uint256 vaultId = uint256(_returnValues[0]);

    IManager(mcdManager).cdpAllow(vaultId, flashloanProvider, 0);

    return bytes32("");
  }

  function parseInputs(bytes[] memory _callData)
    internal
    returns (address mcdManager, address flashloanProvider)
  {
    mcdManager = abi.decode(_callData[0], (address));
    flashloanProvider = abi.decode(_callData[1], (address));
  }
}
