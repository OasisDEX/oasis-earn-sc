pragma solidity ^0.8.1;

import { Executable } from "../common/Executable.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { SetApprovalData } from "../../core/types/Common.sol";
import { UseStore, Write, Read } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";

contract SetApproval is Executable, UseStore {
  using Read for OperationStorage;
  using SafeERC20 for IERC20;

  constructor(address _registry) UseStore(_registry) {}
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    SetApprovalData memory approval = parseInputs(data);
    approval.amount = store().readUint(bytes32(approval.amount), paramsMap[0]);

    IERC20(approval.asset).safeApprove(approval.delegator, approval.amount);
  }

  function parseInputs(bytes memory _callData) public pure returns (SetApprovalData memory params) {
    return abi.decode(_callData, (SetApprovalData));
  }
}
