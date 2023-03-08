pragma solidity ^0.8.17;

import { IFlashLoanRecipient } from "../flashloan/balancer/IFlashLoanRecipient.sol";
import { IERC20 } from "../../libs/SafeERC20.sol";

interface IVault {
  function flashLoan(
    IFlashLoanRecipient recipient,
    IERC20[] memory tokens,
    uint256[] memory amounts,
    bytes memory userData
  ) external;
}
