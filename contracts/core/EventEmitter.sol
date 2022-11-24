// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.15;

import { Call } from "./types/Common.sol";
/**
 * @title Event Emitter
 * @notice Is responsible for emitting events
 * @dev Allows us to emit events in the context of a single contract
 * rather than events being emitted in the context of every users
 * proxy contract.
 */
contract EventEmitter {

    /**
     * @dev Emitted once an Action has completed execution
     * @param name The Action name
     * @param returned The bytes value returned by the Action
    **/
    event Action(string name, address msgSender, bytes returned);
    /**
     * @dev Emitted once an Operation has completed execution
     * @param name The address initiating the deposit
     * @param calls An array of Action calls the operation must execute
    **/
    event Operation(string name, address msgSender, Call[] calls);

    function emitActionEvent(string memory actionName, address msgSender, bytes calldata encodedReturnValues) external {
        emit Action(actionName, msgSender, encodedReturnValues);
    }

    function emitOperationEvent(string memory operationName, address msgSender, Call[] calldata calls) external {
        emit Operation(operationName, msgSender, calls);
    }
}