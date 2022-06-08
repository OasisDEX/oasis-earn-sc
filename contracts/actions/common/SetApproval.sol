pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/IAction.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import { SetApprovalData } from "../../core/Types.sol";
import { OPERATION_STORAGE } from "../../core/Constants.sol";

contract SetApproval is IAction {
  // TODO: Pass the service registry in here
  constructor(address _registry) IAction(_registry) {}

  function execute(bytes calldata data, uint8[] memory) external payable override {
    SetApprovalData memory approval = abi.decode(data, (SetApprovalData));

    // TODO: Use OZ's safeApprove
    IERC20(approval.asset).approve(approval.delegator, approval.amount);
    // TODO: REMOVE
    storeResult("SetApproval");
  }
}
