pragma solidity ^0.8.1;

import "../common/IAction.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";

contract DummyAction is IAction {
    // TODO: Pass the service registry in here
    constructor(address _registry) IAction(_registry) {}

    function execute(bytes calldata data, uint8[] memory) external payable override {
        OperationStorage txStorage = OperationStorage(
            registry.getRegisteredService("OPERATION_STORAGE")
        );
        console.log("IN THE DUMMY ACTION");
        console.log(txStorage.len());
    }
}
