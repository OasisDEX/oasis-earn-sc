// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import "../common/IAction.sol";
import "../../interfaces/mcd/IJoin.sol";
import "../../interfaces/mcd/IManager.sol";
import "./ActionBase.sol";
import "hardhat/console.sol";

contract OpenVault is IAction {
    function executeAction(
        bytes[] memory _callData,
        uint256[] memory _paramsMapping,
        bytes32[] memory _returnValues,
        uint256 fee
    ) public payable override returns (bytes32) {
        (address joinAddr, address mcdManager) = parseInputs(_callData);

        uint256 newVaultId = _openVault(joinAddr, mcdManager);

        return bytes32(newVaultId);
    }

    function actionType() public pure override returns (uint8) {
        return uint8(ActionType.DEFAULT);
    }

    function _openVault(address _joinAddr, address _mcdManager)
        internal
        returns (uint256 vaultId)
    {
        bytes32 ilk = IJoin(_joinAddr).ilk();
        vaultId = IManager(_mcdManager).open(ilk, address(this));
    }

    function parseInputs(bytes[] memory _callData)
        internal
        pure
        returns (address joinAddr, address mcdManager)
    {
        joinAddr = abi.decode(_callData[0], (address));
        mcdManager = abi.decode(_callData[1], (address));
    }
}
