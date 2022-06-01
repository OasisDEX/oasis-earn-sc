// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import "../common/Action.sol";
import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";
import "../../interfaces/maker/IJoin.sol";
import "../../interfaces/maker/IManager.sol";

import {OpenVaultData} from "../../core/types/Maker.sol";

contract OpenVault is Action {
    constructor(ServiceRegistry _registry) Action(_registry) {}

    function execute(bytes calldata data, uint8[] memory)
        external
        payable
        override
    {
        OpenVaultData memory openVaultData = abi.decode(data, (OpenVaultData));

        bytes32 vaultId = _openVault(openVaultData);
        push(vaultId);
    }

    function _openVault(OpenVaultData memory data) internal returns (bytes32) {
        bytes32 ilk = IJoin(data.joinAddress).ilk();
        uint256 vaultId = IManager(data.mcdManager).open(ilk, address(this));

        return bytes32(vaultId);
    }
}
