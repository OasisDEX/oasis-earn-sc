pragma solidity ^0.8.1;

import "../common/Action.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";

contract DummyAction is Action {
    constructor(ServiceRegistry _registry) Action(_registry) {}

    function execute(bytes calldata, uint8[] memory) external payable override {
        OperationStorage txStorage = OperationStorage(
            registry.getRegisteredService("OPERATION_STORAGE")
        );
        console.log("IN THE DUMMY ACTION");
        console.log(txStorage.len());
    }
}
