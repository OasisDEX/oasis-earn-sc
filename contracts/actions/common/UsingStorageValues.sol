pragma solidity ^0.8.1;

import "../../core/OperationStorage.sol";
import "../../core/ServiceRegistry.sol";

abstract contract UsingStorageValues {
    ServiceRegistry internal immutable registry;

    constructor(address _registry) {
        registry = ServiceRegistry(_registry);
    }

    function useValue(bytes memory param, uint256 paramMapping)
        internal
        view
        returns (bytes memory)
    {
        if (paramMapping > 0) {
            bytes memory value = OperationStorage(
                registry.getRegisteredService("OPERATION_STORAGE")
            ).at(paramMapping - 1);

            return value;
        }

        return param;
    }
}
