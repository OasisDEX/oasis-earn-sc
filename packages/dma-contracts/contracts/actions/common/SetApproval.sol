// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { SetApprovalData } from "../../core/types/Common.sol";
import { SafeMath } from "../../libs/SafeMath.sol";
import { UseStorageSlot, StorageSlot, Write, Read } from "../../libs/UseStorageSlot.sol";
import { ServiceRegistry } from "../../core/ServiceRegistry.sol";

/**
 * @title SetApproval Action contract
 * @notice Transfer token from the calling contract to the destination address
 */
contract SetApproval is Executable, UseStorageSlot {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;
  using Read for StorageSlot.TransactionStorage;

  ServiceRegistry internal immutable registry;

  constructor(address _registry) {
    registry = ServiceRegistry(_registry);
  }

  /**
   * @dev Look at UseStore.sol to get additional info on paramsMapping
   * @param data Encoded calldata that conforms to the SetApprovalData struct
   * @param paramsMap Maps operation storage values by index (index offset by +1) to execute calldata params
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    SetApprovalData memory approval = parseInputs(data);

    uint256 mappedApprovalAmount = store().readUint(
      bytes32(approval.amount),
      paramsMap[2]
    );
    uint256 actualApprovalAmount = approval.sumAmounts
      ? mappedApprovalAmount.add(approval.amount)
      : mappedApprovalAmount;

    IERC20(approval.asset).safeApprove(approval.delegate, actualApprovalAmount);
  }

  function parseInputs(bytes memory _callData) public pure returns (SetApprovalData memory params) {
    return abi.decode(_callData, (SetApprovalData));
  }
}
