pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/IAction.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import {SetApprovalData} from "../../core/Types.sol";

contract SetApproval is IAction {
    ServiceRegistry public immutable registry;

    // TODO: Pass the service registry in here
    constructor(address _registry) {
        registry = ServiceRegistry(_registry);
    }

    function execute(bytes calldata data)
        external
        payable
        override
        returns (bytes memory)
    {
        console.log("SetApproval TOKEN!!!");
        OperationStorage txStorage = OperationStorage(
            registry.getRegisteredService("OPERATION_STORAGE")
        );
        txStorage.push("SetApproval");
        SetApprovalData memory approval = abi.decode(data, (SetApprovalData));

        // TODO: Use OZ's safeApprove
        IERC20(approval.asset).approve(approval.delegator, approval.amount);
        return "";
    }
}
