pragma solidity ^0.8.1;

interface Executable {
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable;

  /**
   * @dev Emitted once an Action has completed execution
   * @param name The Action name
   * @param returned The name of the Action being executed
   **/
  event Action(string name, bytes32 returned);
}
