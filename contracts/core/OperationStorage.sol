pragma solidity ^0.8.1;
import "hardhat/console.sol";

// TODO: Allow only whitelisted addresses to call methods on this storage
// In our case this will be the OperationExecutor.
contract OperationStorage {
  address private owner;
  uint8 step = 0;
  bytes32[] private steps;
  bytes32[] private returnValues;

  constructor() {
    owner = msg.sender;
  }

  function setOperationSteps(bytes32[] memory _steps) external {
    steps = _steps;
  }

  function verifyStep(bytes32 stepHash) external {
    console.log("DEBUG: CURRENT VERIFIED STEP:", step);
    console.log("DEBUG: STEP HASH TO VERIFY");
    console.logBytes32(stepHash);
    console.log("DEBUG: CURRENT STEP HASH:");
    console.logBytes32(steps[step]);
    require(steps[step] == stepHash, "incorrect-step");
    console.log("DEBUG: Step is valid!");
    console.log("-------------------------");
    step++;
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
    delete step;
    delete steps;
    delete returnValues;
  }
}
