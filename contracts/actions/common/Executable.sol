pragma solidity ^0.8.1;

interface Executable {
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable;

  /**
   * @dev Emitted when called
   * @param name The name of the Action being executed
   * @param data The address initiating the deposit
   * @param paramsMap The beneficiary of the deposit, receiving the aTokens
   **/
  event Started(string name, bytes data, uint8[] paramsMap);

  /**
   * @dev Emitted just prior to the Action returning
   * @param returned The name of the Action being executed
   **/
  event Completed(string name, bytes32 returned);
}
