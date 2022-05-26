pragma solidity ^0.8.1;
import "hardhat/console.sol";

contract OperationStorage {
    address private owner;
    bytes32[] private returnValues = [bytes32("test")];

    constructor() {
        owner = msg.sender;
    }

    function push(bytes32 value) external {
        console.log("DEBUG: PUSHED");
        console.logBytes32(value);
        returnValues.push(value);
    }

    function at(uint256 index) external view returns (bytes32) {
        console.log("DEBUG: PULLED");
        console.logBytes32(returnValues[index]);
        return returnValues[index];
    }

    function len() external view returns (uint256) {
        return returnValues.length;
    }

    function finalize() external {
        console.log("DEBUG: Finalizing...");
        delete returnValues;
    }
}
