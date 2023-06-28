// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../../actions/common/Executable.sol";
import { UseStorageSlot, StorageSlot, Read } from "../../UseStorageSlot.sol";
import { SafeERC20, IERC20 } from "../../../libs/SafeERC20.sol";
import { SendTokenData } from "../../../core/types/Common.sol";
import { ETH } from "../../../core/constants/Common.sol";

/**
 * @title SendToken Action contract
 * @notice This contract has the ability to send ERC20 tokens and native ETH.
 * The assumption is that this contract is called with a delegatecall using a proxy contract.
 *  - The amount of ERC20 token can be transferred is either an amount
 * that's been received in the current transaction ( through the usage of other actions)
 * or some amount that has been transferred prior this transaction
 *  - The amount of ETH that can be transferred is either the whole or
 * partial ( whether some amount has been used in other actions) amount from the
 * amount that the transaction has been called with ( msg.value ). If the proxy contract
 * contains any prior ETH balance, it CANNOT be transferred.
 */
contract SendTokenV2 is Executable, UseStorageSlot {
  using SafeERC20 for IERC20;
  using Read for StorageSlot.TransactionStorage;

  /**
   * @param data Encoded calldata that conforms to the SendTokenData struct
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    SendTokenData memory send = parseInputs(data);
    send.amount = store().readUint(bytes32(send.amount), paramsMap[2]);

    if (msg.value > 0) {
      payable(send.to).transfer(msg.value);
    } else {
      if (send.amount == type(uint256).max) {
        send.amount = IERC20(send.asset).balanceOf(address(this));
      }
      IERC20(send.asset).safeTransfer(send.to, send.amount);
    }
  }

  function parseInputs(bytes memory _callData) public pure returns (SendTokenData memory params) {
    return abi.decode(_callData, (SendTokenData));
  }
}
