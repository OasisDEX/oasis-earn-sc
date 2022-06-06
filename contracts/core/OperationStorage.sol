pragma solidity ^0.8.1;
import "hardhat/console.sol";

// TODO: Allow only whitelisted addresses to call methods on this storage
// In our case this will be the OperationExecutor.
contract OperationStorage {
    address private owner;
    bytes[] private returnValues = [bytes("test")];

    constructor() {
        owner = msg.sender;
    }

    function push(bytes memory value) external {
        returnValues.push(value);
    }

    function at(uint256 index) external view returns (bytes memory) {
        console.log("DEBUG: PULLED");
        console.log("LENG", returnValues.length);
        console.logBytes(returnValues[index]);
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
