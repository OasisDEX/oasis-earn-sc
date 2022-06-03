pragma solidity ^0.8.1;

import {Operation} from "./Types.sol";

// TODO: If we go with this idea, this should be secured like ServiceRegistry
contract OperationsRegistry {
    mapping(string => bytes32[]) private operations;

    function addOperation(string memory name, bytes32[] memory steps) external {
        operations[name] = steps;
    }

    function getOperation(string memory name)
        external
        view
        returns (bytes32[] memory steps)
    {
        steps = operations[name];
        require(steps.length > 0, "noop");
    }
}
