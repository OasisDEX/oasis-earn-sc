pragma solidity ^0.8.15;

import { ServiceRegistry } from "./ServiceRegistry.sol";

contract OperationStorage {
  uint8 internal action = 0;
  bytes32[] public actions;
  bytes32[] public returnValues;

  uint256 private constant _NOT_ENTERED = 1;
  uint256 private constant _ENTERED = 2;
  uint256 private _status;

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

  function nonReentrant() internal {
    require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

    _status = _ENTERED;
  }

  function clearStorageBefore() external {
    nonReentrant();
    delete action;
    delete actions;
    delete returnValues;
  }

  function clearStorageAfter() external {
    delete action;
    delete actions;
    delete returnValues;
    _status = _NOT_ENTERED;
  }
}
