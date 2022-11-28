pragma solidity ^0.8.15;

import { Executable } from "../actions/common/Executable.sol";
import { SafeERC20, IERC20 } from "../libs/SafeERC20.sol";
import { UseStore, Read, Write } from "../actions/common/UseStore.sol";
import { OperationStorage } from "../core/OperationStorage.sol";
import { EVENT_EMITTER_TEST_ACTION } from "../core/constants/Test.sol";
import { EVENT_EMITTER } from "../core/constants/Common.sol";
import { IEventEmitter } from "../interfaces/common/IEventEmitter.sol";
import { OPERATION_STORAGE } from "../core/constants/Common.sol";
import "hardhat/console.sol";

struct EventEmitterTestData {
  bool breakEvents;
}

contract EventEmitterTestAction is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Read for OperationStorage;
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    store().write(bytes32("123"));
    EventEmitterTestData memory eventEmitterTestData = abi.decode(data, (EventEmitterTestData));

    OperationStorage opStorage = OperationStorage(registry.getRegisteredService(OPERATION_STORAGE));
    opStorage.setProxy();

    IEventEmitter eventEmitter = IEventEmitter(registry.getRegisteredService(EVENT_EMITTER));
    address incorrectAddress = 0xE5c5482220CaB3dB0d222Df095dA739DA277a18F;
    eventEmitter.emitActionEvent(
      EVENT_EMITTER_TEST_ACTION,
      eventEmitterTestData.breakEvents ? incorrectAddress : address(this),
      bytes(abi.encode(uint256(123)))
    );
  }
}
