pragma solidity ^0.8.1;
import "hardhat/console.sol";

// TODO: Allow only whitelisted addresses to call methods on this storage
// In our case this will be the OperationExecutor.
contract OperationStorage {
  address private owner;
  bytes32[] private returnValues = [bytes32("test")];

  constructor() {
    owner = msg.sender;
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
    delete returnValues;
  }
}
