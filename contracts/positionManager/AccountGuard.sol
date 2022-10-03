// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/proxy/Proxy.sol";
import "hardhat/console.sol";

contract AccountGuard {
  mapping(address => bool) exists;
  mapping(address => mapping(address => bool)) allowed;

  function canCall(address proxy, address operator) external view returns (bool) {
    return allowed[operator][proxy];
  }

  function permit(
    address caller,
    address target,
    bool allowance
  ) external {
    if (!exists[target]) {
      exists[target] = true;
      require(allowance == true, "account-guard/at-least-one-owner");
    } else {
      require(allowed[msg.sender][target], "account-guard/not-owner");
    }
    allowed[caller][target] = allowance;
  }
}
