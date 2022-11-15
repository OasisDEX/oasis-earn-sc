pragma solidity ^0.8.15;
import "hardhat/console.sol";

contract SuicideBomb {
  fallback() external {
    console.log("KABOOM!");
    console.log(address(this));
    selfdestruct(payable(address(0)));
  }
}
