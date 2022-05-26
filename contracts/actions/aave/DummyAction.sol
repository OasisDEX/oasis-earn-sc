pragma solidity ^0.8.1;

import "../common/IAction.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";

contract DummyAction is IAction {
    ServiceRegistry public immutable registry;

    // TODO: Pass the service registry in here
    constructor(address _registry) {
        registry = ServiceRegistry(_registry);
    }

    function execute(bytes calldata data)
        external
        payable
        override
        returns (bytes memory)
    {
        OperationStorage txStorage = OperationStorage(
            registry.getRegisteredService("OPERATION_STORAGE")
        );
        console.log("IN THE DUMMY ACTION");
        console.log(txStorage.len());
        return "";
    }
}
