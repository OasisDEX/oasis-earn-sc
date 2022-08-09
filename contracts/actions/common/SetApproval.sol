pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { SetApprovalData } from "../../core/types/Common.sol";
import { SET_APPROVAL_ACTION } from "../../core/constants/Common.sol";

contract SetApproval is Executable {
  using SafeERC20 for IERC20;

  function execute(bytes calldata data, uint8[] memory) external payable override {
    SetApprovalData memory approval = abi.decode(data, (SetApprovalData));
    IERC20(approval.asset).safeApprove(approval.delegator, approval.amount);

    emit Action(SET_APPROVAL_ACTION, bytes32(approval.amount));
  }
}
