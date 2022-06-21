pragma solidity ^0.8.1;
import "hardhat/console.sol";
import "./ServiceRegistry.sol";

// TODO: Allow only whitelisted addresses to call methods on this storage
// In our case this will be the OperationExecutor.
contract OperationStorage {
  address private owner;
  uint8 action = 0;
  bytes32[] public actions;
  bytes32[] public returnValues;
  ServiceRegistry internal immutable registry;

  constructor(address _registry) {
    owner = msg.sender;
    registry = ServiceRegistry(_registry);
  }

  function setOperationSteps(bytes32[] memory _actions) external {
    actions = _actions;
  }

  function verifyStep(bytes32 actionHash) external {
    require(actions[action] == actionHash, "incorrect-step");
    registry.getServiceAddress(actionHash);
    action++;
  }

  function hasStepsToVerify() external view returns (bool) {
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

  function finalize() external {
    delete action;
    delete actions;
    delete returnValues;
  }
}
