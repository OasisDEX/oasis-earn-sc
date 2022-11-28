// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.15;

import { Read, UseStore } from "../actions/common/UseStore.sol";
import { Call } from "./types/Common.sol";
import "hardhat/console.sol";

/**
 * @title Event Emitter
 * @notice Is responsible for emitting events
 * @dev Allows us to emit events in the context of a single contract
 * rather than events being emitted in the context of every users
 * proxy contract.
 */
contract EventEmitter is UseStore {
  constructor(address _registry) UseStore(_registry) {}

  /**
   * @dev Emitted once an Action has completed execution
   * @param name The Action name
   * @param proxyAddress The proxy address of the user executing the t/x
   * @param returned The bytes value returned by the Action
   **/
  event Action(string indexed name, address proxyAddress, bytes returned);
  /**
   * @dev Emitted once an Operation has completed execution
   * @param name The name of the operation
   * @param proxyAddress The proxy address of the user executing the t/x
   * @param calls An array of Action calls the operation must execute
   **/
  event Operation(string indexed name, address proxyAddress, Call[] calls);

  /**
   * @notice function called by inidividual Actions to emit an event
   * @dev Cannot be called unless proxyAddress matches up with proxyAddress stored in OperationStorage
   * @param actionName The Action name
   * @param proxyAddress The proxy address of the user executing the t/x
   * @param encodedReturnValues The bytes value returned by the Action
   **/
  function emitActionEvent(
    string memory actionName,
    address proxyAddress,
    bytes calldata encodedReturnValues
  ) external {
    require(
      proxyAddress == store().getProxy(),
      "proxy address and stored proxy address do not match"
    );
    emit Action(actionName, proxyAddress, encodedReturnValues);
  }

  /**
   * @notice function called by Operation Executor to emit event
   * @dev Cannot be called unless proxyAddress matches up with proxyAddress stored in OperationStorage
   * @param operationName The name of the operation
   * @param proxyAddress The proxy address of the user executing the t/x
   * @param calls An array of Action calls the operation must execute
   **/
  function emitOperationEvent(
    string memory operationName,
    address proxyAddress,
    Call[] calldata calls
  ) external {
    require(
      proxyAddress == store().getProxy(),
      "proxy address and stored proxy address do not match"
    );
    emit Operation(operationName, proxyAddress, calls);
  }
}
