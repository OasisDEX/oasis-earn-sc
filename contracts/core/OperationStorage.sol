pragma solidity ^0.8.15;

import { ServiceRegistry } from "./ServiceRegistry.sol";

contract OperationStorage {
  uint8 internal action = 0;
  bytes32[] public actions;
  bytes32[] public returnValues;

  address private context;

  ServiceRegistry internal immutable registry;

  constructor(ServiceRegistry _registry) {
    registry = _registry;
  }

  function setOperationActions(bytes32[] memory _actions) external {
    actions = _actions;
  }

  function verifyAction(bytes32 actionHash) external {
    require(actions[action] == actionHash, "incorrect-action");
    registry.getServiceAddress(actionHash);
    action++;
  }

  function hasActionsToVerify() external view returns (bool) {
    return actions.length > 0;
  }

  function push(bytes32 value) external {
    returnValues.push(value);
  }

  function at(uint256 index) external view returns (bytes32) {
    return returnValues[index];
  }

  function len() external view returns (uint256) {
    return returnValues.length;
  }

  function clearStorageBefore() external {
    require(msg.sender != context, "ReentrancyGuard: reentrant call");
    context = address(msg.sender);
    clearStorage();
  }

  function clearStorageAfter() external {
    require(msg.sender == context, "ReentrancyGuard: cannot reset call");
    context = address(0);
    clearStorage();
  }

  function clearStorage() internal {
    delete action;
    delete actions;
    delete returnValues;
  }
}
