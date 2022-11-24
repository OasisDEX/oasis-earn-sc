pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { UseStore } from "../common/UseStore.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { PullTokenData } from "../../core/types/Common.sol";
import { EVENT_EMITTER, PULL_TOKEN_ACTION } from "../../core/constants/Common.sol";
import "../../core/types/Common.sol";
import { IEventEmitter } from "../../interfaces/common/IEventEmitter.sol";

/**
 * @title PullToken Action contract
 * @notice Pulls token from a target address to the current calling context
 */
contract PullToken is Executable, UseStore {
  using SafeERC20 for IERC20;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @dev Is intended to pull tokens in to a user's proxy (the calling context)
   * @param data Encoded calldata that conforms to the PullTokenData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    PullTokenData memory pull = parseInputs(data);

    IERC20(pull.asset).safeTransferFrom(pull.from, address(this), pull.amount);

    IEventEmitter eventEmitter = IEventEmitter(registry.getRegisteredService(EVENT_EMITTER));
    eventEmitter.emitActionEvent(PULL_TOKEN_ACTION, address(this), bytes(abi.encode(pull.amount)));
  }

  function parseInputs(bytes memory _callData) public pure returns (PullTokenData memory params) {
    return abi.decode(_callData, (PullTokenData));
  }
}
