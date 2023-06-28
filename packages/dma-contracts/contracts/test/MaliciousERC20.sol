pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MaliciousERC20 is ERC20 {
  // The target contract we want to exploit
  address private targetContract;

  constructor(address _targetContract) ERC20("Malicious Token", "MT") {
    targetContract = _targetContract;
  }

  // Overriding the transfer function to include re-entrancy attack
  function transfer(address recipient, uint256 amount) public override returns (bool) {
    super.transfer(recipient, amount);

    // TODO: Implement re-entrancy attack

    return true;
  }
}
