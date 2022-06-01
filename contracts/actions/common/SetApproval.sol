pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "./Action.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import {SetApprovalData} from "../../core/types/Common.sol";

contract SetApproval is Action {
    constructor(ServiceRegistry _registry) Action(_registry) {}

    function execute(bytes calldata data, uint8[] memory)
        external
        payable
        override
    {
        console.log("SetApproval TOKEN!!!");
        push("SetApproval");
        SetApprovalData memory approval = abi.decode(data, (SetApprovalData));

        // TODO: Use OZ's safeApprove
        IERC20(approval.asset).approve(approval.delegator, approval.amount);
    }
}
