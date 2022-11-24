pragma solidity ^0.8.1;

import { Executable } from "../common/Executable.sol";
import { ServiceRegistry } from "../../core/ServiceRegistry.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { IWETH } from "../../interfaces/tokens/IWETH.sol";
import { WrapEthData } from "../../core/types/Common.sol";
import { UseStore, Read } from "../../actions/common/UseStore.sol";
import { Swap } from "./Swap.sol";
import { EVENT_EMITTER, WETH, SWAP } from "../../core/constants/Common.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { WRAP_ETH } from "../../core/constants/Common.sol";
import { IEventEmitter } from "../../interfaces/common/IEventEmitter.sol";

/**
 * @title Wraps ETH Action contract
 * @notice Wraps ETH balances to Wrapped ETH
 */
contract WrapEth is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @dev look at UseStore.sol to get additional info on paramsMapping
   * @param data Encoded calldata that conforms to the WrapEthData struct
   * @param paramsMap Maps operation storage values by index (index offset by +1) to execute calldata params
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    WrapEthData memory wrapData = parseInputs(data);
    wrapData.amount = store().readUint(bytes32(wrapData.amount), paramsMap[0], address(this));

    if (wrapData.amount == type(uint256).max) {
      wrapData.amount = address(this).balance;
    }

    IWETH(registry.getRegisteredService(WETH)).deposit{ value: wrapData.amount }();

    IEventEmitter eventEmitter = IEventEmitter(registry.getRegisteredService(EVENT_EMITTER));
    eventEmitter.emitActionEvent(WRAP_ETH, address(this), bytes(abi.encode(wrapData.amount)));
  }

  function parseInputs(bytes memory _callData) public pure returns (WrapEthData memory params) {
    return abi.decode(_callData, (WrapEthData));
  }
}
