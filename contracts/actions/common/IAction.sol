pragma solidity ^0.8.1;

import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import {OPERATION_STORAGE} from "../../core/Constants.sol";

abstract contract IAction {
    ServiceRegistry public immutable registry;

    constructor(address _registry) {
        registry = ServiceRegistry(_registry);
    }

    function execute(bytes calldata data) external payable virtual;
}
