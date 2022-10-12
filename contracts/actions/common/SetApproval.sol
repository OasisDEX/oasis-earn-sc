pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { SetApprovalData } from "../../core/types/Common.sol";
import { UseStore, Read } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { SET_APPROVAL_ACTION } from "../../core/constants/Common.sol";

/**
 * @title SetApproval Action contract
 * @notice Transfer token from the calling contract to the destination address
 */
contract SetApproval is Executable, UseStore {
  using SafeERC20 for IERC20;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @dev look at UseStore.sol to get additional info on paramsMapping
   * @param data Encoded calldata that conforms to the SetApprovalData struct
   * @param paramsMap Maps operation storage values by index (index offset by +1) to execute calldata params
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    SetApprovalData memory approval = parseInputs(data);

    approval.amount = store().readUint(bytes32(approval.amount), paramsMap[2], address(this));
    IERC20(approval.asset).safeApprove(approval.delegate, approval.amount);

    emit Action(SET_APPROVAL_ACTION, bytes32(approval.amount));
  }

  function parseInputs(bytes memory _callData) public pure returns (SetApprovalData memory params) {
    return abi.decode(_callData, (SetApprovalData));
  }
}
