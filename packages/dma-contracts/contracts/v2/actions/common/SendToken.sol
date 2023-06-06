// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../../actions/common/Executable.sol";
import { UseStorageSlot, StorageSlot, Read } from "../../UseStorageSlot.sol";
import { SafeERC20, IERC20 } from "../../../libs/SafeERC20.sol";
import { SendTokenData } from "../../../core/types/Common.sol";
import { ETH } from "../../../core/constants/Common.sol";

/**
 * @title SendToken Action contract
 * @notice Transfer token from the calling contract to the destination address
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
