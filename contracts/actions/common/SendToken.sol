pragma solidity ^0.8.1;

import { Executable } from "../common/Executable.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { SendTokenData } from "../../core/types/Common.sol";

// TODO: Be able to differentiate between ETH and ERC20 tokens
contract SendToken is Executable {
  using SafeERC20 for IERC20;

  function execute(bytes calldata data, uint8[] memory) external payable override {
    SendTokenData memory send = abi.decode(data, (SendTokenData));
    IERC20(send.asset).safeTransfer(send.to, send.amount);
  }
}
