pragma solidity ^0.8.1;

interface Executable {
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable;

  /**
   * @dev Emitted once an Action has completed execution
   * @param name The Action name
   * @param data The address initiating the deposit
   * @param paramsMap The beneficiary of the deposit, receiving the aTokens
   * @param returned The name of the Action being executed
   **/
  event Action(string name, bytes data, uint8[] paramsMap, bytes32 returned);
}
