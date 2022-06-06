pragma solidity ^0.8.1;

import "../common/Executable.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";

contract DummyAction is Executable {
    ServiceRegistry internal immutable registry;

    constructor(address _registry) {
        registry = ServiceRegistry(_registry);
    }

    function execute(bytes calldata data) external payable override {
        OperationStorage txStorage = OperationStorage(
            registry.getRegisteredService("OPERATION_STORAGE")
        );
        console.log("IN THE DUMMY ACTION");
        console.log(txStorage.len());
    }
}
