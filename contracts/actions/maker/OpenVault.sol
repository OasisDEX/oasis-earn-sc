// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.7.6;
pragma abicoder v2;

import "../../common/IAction.sol";
import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";
import "../../interfaces/maker/IJoin.sol";
import "../../interfaces/maker/IManager.sol";

import {OpenVaultData} from "../../core/types/Maker.sol";

contract OpenVault is IAction {
    ServiceRegistry public immutable registry;

    constructor(address _registry) {
        registry = ServiceRegistry(_registry);
    }

    function execute(bytes calldata data, uint8[] memory _paramsMapping)
        external
        payable
        override
        returns (bytes memory)
    {
        OpenVaultData memory openVaultData = abi.decode(data, (OpenVaultData));

        bytes32 vaultId = _openVault(openVaultData);
        OperationStorage txStorage = OperationStorage(
            registry.getRegisteredService("OPERATION_STORAGE")
        );
        txStorage.push(vaultId);

        return "";
    }

    function _openVault(OpenVaultData memory data) internal returns (bytes32) {
        bytes32 ilk = IJoin(data.joinAddress).ilk();
        vaultId = IManager(data.mcdManager).open(ilk, address(this));

        return bytes32(vaultId);
    }

    function actionType() public pure override returns (uint8) {
        return uint8(ActionType.DEFAULT);
    }
}
