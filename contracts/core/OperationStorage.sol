pragma solidity ^0.8.15;

import { ServiceRegistry } from "./ServiceRegistry.sol";

contract OperationStorage {
  uint8 internal action = 0;
  bytes32[] public actions;
  mapping(address => bytes32[]) public returnValues;

  address[] public valuesHolders;


  bool private locked;
  address private whoLocked;



  ServiceRegistry internal immutable registry;

  constructor(ServiceRegistry _registry) {
    registry = _registry;
  }

  function lock() external{
    require(locked == false, "Not locked");
    locked = true;
    whoLocked = msg.sender;
  }

  function unlock() external{
    require(whoLocked == msg.sender, "Only the locker can unlock");
    require(locked, "Not locked");
    locked = false;
    whoLocked = msg.sender;
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
    if(returnValues[msg.sender].length ==0){
      valuesHolders.push(msg.sender);
    }
    returnValues[msg.sender].push(value);

  }

  function at(uint256 index, address who) external view returns (bytes32) {
    return returnValues[who][index];
  }

  function len(address who) external view returns (uint256) {
    return returnValues[who].length;
  }


  function clearStorageBefore() external {
    delete action;
    delete actions;
    for(uint256 i = 0; i < valuesHolders.length; i++){
      delete returnValues[valuesHolders[i]];
    }
    delete valuesHolders;
  }

  function clearStorageAfter() external {
    delete action;
    delete actions;
    for(uint256 i = 0; i < valuesHolders.length; i++){
      delete returnValues[valuesHolders[i]];
    }
    delete valuesHolders;
  }
}
