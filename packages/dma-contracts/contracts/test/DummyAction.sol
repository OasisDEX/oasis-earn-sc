// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../actions/common/Executable.sol";
import { SafeERC20, IERC20 } from "../libs/SafeERC20.sol";
import { SetApprovalData } from "../core/types/Common.sol";
import { UseStore, Read, Write } from "../actions/common/UseStore.sol";
import { OperationStorage } from "../core/OperationStorage.sol";

contract DummyAction is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Read for OperationStorage;
  using Write for OperationStorage;

  event DummyActionEvent(address sender, uint256 amount);

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata, uint8[] memory) external payable override {
    store().write(bytes32("123"));

    emit DummyActionEvent(msg.sender, 123);
  }
}
