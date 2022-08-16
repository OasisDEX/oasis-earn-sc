pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { SetApprovalData } from "../../core/types/Common.sol";
import { UseStore, Read } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { SET_APPROVAL_ACTION } from "../../core/constants/Common.sol";

contract SetApproval is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    SetApprovalData memory approval = abi.decode(data, (SetApprovalData));

    approval.amount = store().readUint(bytes32(approval.amount), paramsMap[2]);
    IERC20(approval.asset).safeApprove(approval.delegator, approval.amount);

    emit Action(SET_APPROVAL_ACTION, bytes32(approval.amount));
  }
}
