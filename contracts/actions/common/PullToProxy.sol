pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { PullToProxyData } from "../../core/types/Common.sol";
import { PULL_TO_PROXY_ACTION, ETH } from "../../core/constants/Common.sol";
import { DSProxy } from "../../libs/DS/DSProxy.sol";

/**
 * @title PullToProxy Action contract
 * @notice Pulls funds into a user's proxy from a user's EOA
 */
contract PullToProxy is Executable {
  using SafeERC20 for IERC20;

  /**
   * @param data Encoded calldata that conforms to the PullToProxyData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    PullToProxyData memory pull = abi.decode(data, (PullToProxyData));

    IERC20(pull.asset).safeTransferFrom(msg.sender, address(this), pull.amount);

    emit Action(PULL_TO_PROXY_ACTION, bytes(abi.encode(pull.amount, pull.asset)));
  }
}
