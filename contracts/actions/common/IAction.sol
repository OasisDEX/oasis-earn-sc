pragma solidity ^0.8.1;

import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import {OPERATION_STORAGE} from "../../core/Constants.sol";

abstract contract IAction {
    ServiceRegistry public immutable registry;

    constructor(address _registry) {
        registry = ServiceRegistry(_registry);
    }

    function execute(bytes calldata data, uint8[] memory _paramsMapping) external payable virtual;

    function storeResult(bytes32 result) internal {
        OperationStorage(registry.getRegisteredService(OPERATION_STORAGE)).push(
                result
            );
    }

    // TODO: unify these functions with above one

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
