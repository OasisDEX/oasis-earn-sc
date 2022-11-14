pragma solidity ^0.8.15;

import "../flashloan/balancer/IFlashLoanRecipient.sol";
import "../tokens/IERC20.sol";

interface IVault {
  function flashLoan(
    IFlashLoanRecipient recipient,
    IERC20[] memory tokens,
    uint256[] memory amounts,
    bytes memory userData
  ) external;
}