// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.15;

import { Executable } from "../actions/common/Executable.sol";
import { SafeERC20, IERC20 } from "../libs/SafeERC20.sol";
import { SetApprovalData } from "../core/types/Common.sol";
import { UseStore, Read, Write } from "../actions/common/UseStore.sol";
import { OperationStorage } from "../core/OperationStorage.sol";
import { SET_APPROVAL_ACTION } from "../core/constants/Common.sol";

contract DummyAction is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Read for OperationStorage;
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata, uint8[] memory) external payable override {
    store().write(bytes32("123"));
  }
}
