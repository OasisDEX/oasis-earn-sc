// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../contracts/actions/common/Executable.sol";
import { SafeERC20, IERC20 } from "../../contracts/libs/SafeERC20.sol";
import { UseStorageSlot, StorageSlot, Read } from "../libs/UseStorageSlot.sol";

contract DummyReadAction is Executable, UseStorageSlot {
  using SafeERC20 for IERC20;
  using Read for StorageSlot.TransactionStorage;

  event ReadValue(bytes32 value);

  function execute(bytes calldata, uint8[] memory paramsMap) external payable override {
    emit ReadValue(store().read(bytes32(0), paramsMap[0]));
  }
}
