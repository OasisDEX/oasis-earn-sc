// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.1;

import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";

abstract contract Action {
    ServiceRegistry public immutable registry;

    constructor(ServiceRegistry _registry) {
        registry = _registry;
    }

    function execute(bytes calldata data, uint8[] memory _paramsMapping)
        external
        payable
        virtual;

    function push(bytes32 value) internal {
        OperationStorage(registry.getRegisteredService("OPERATION_STORAGE"))
            .push(value);
    }

    function pull(uint256 param, uint256 paramMapping)
        internal
        view
        returns (uint256)
    {
        if (paramMapping > 0) {
            bytes32 value = OperationStorage(
                registry.getRegisteredService("OPERATION_STORAGE")
            ).at(paramMapping - 1);

            return uint256(value);
        }

        return param;
    }

    function at(uint256 index) internal view returns (bytes32) {
        return
            OperationStorage(registry.getRegisteredService("OPERATION_STORAGE"))
                .at(index);
    }
}
