pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { DepositFundsData } from "../../core/types/Common.sol";
import { DEPOSIT_FUNDS_ACTION, ETH } from "../../core/constants/Common.sol";
import { DSProxy } from "../../libs/DS/DSProxy.sol";

/**
 * @title DepositFunds Action contract
 * @notice Deposits funds to a user's proxy from a user's EOA
 */
contract DepositFunds is Executable {
  using SafeERC20 for IERC20;

  /**
   * @param data Encoded calldata that conforms to the ReturnFundsData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    DepositFundsData memory deposit = abi.decode(data, (DepositFundsData));

    IERC20(deposit.asset).safeTransferFrom(msg.sender, address(this), deposit.amount);

    emit Action(DEPOSIT_FUNDS_ACTION, bytes32(abi.encodePacked(deposit.amount, deposit.asset)));
  }
}
