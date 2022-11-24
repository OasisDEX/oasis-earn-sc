pragma solidity ^0.8.15;

import { UseStore } from "../common/UseStore.sol";
import { Executable } from "../common/Executable.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { SendTokenData } from "../../core/types/Common.sol";
import { EVENT_EMITTER, SEND_TOKEN_ACTION } from "../../core/constants/Common.sol";
import { IEventEmitter } from "../../interfaces/common/IEventEmitter.sol";

/**
 * @title SendToken Action contract
 * @notice Transfer token from the calling contract to the destination address
 */
contract SendToken is Executable, UseStore {
  using SafeERC20 for IERC20;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @param data Encoded calldata that conforms to the SendTokenData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    SendTokenData memory send = parseInputs(data);

    if (msg.value > 0) {
      payable(send.to).transfer(send.amount);
    } else {
      IERC20(send.asset).safeTransfer(send.to, send.amount);
    }

    IEventEmitter eventEmitter = IEventEmitter(registry.getRegisteredService(EVENT_EMITTER));
    eventEmitter.emitActionEvent(SEND_TOKEN_ACTION, address(this), bytes(abi.encode(send.amount)));
  }

  function parseInputs(bytes memory _callData) public pure returns (SendTokenData memory params) {
    return abi.decode(_callData, (SendTokenData));
  }
}
