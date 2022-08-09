pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { PullTokenData } from "../../core/types/Common.sol";

contract PullToken is Executable {
  using SafeERC20 for IERC20;

  function execute(bytes calldata data, uint8[] memory) external payable override {
    PullTokenData memory pull = abi.decode(data, (PullTokenData));
    IERC20(pull.asset).safeTransferFrom(pull.from, address(this), pull.amount);
  }
}
