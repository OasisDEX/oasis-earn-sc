pragma solidity ^0.8.15;

contract SuicideBomb {
  fallback() external payable {
    selfdestruct(payable(address(0)));
  }
}
