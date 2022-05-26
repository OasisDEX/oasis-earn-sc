pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/IAction.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import {PullTokenData} from "../../core/Types.sol";

contract PullToken is IAction {
    ServiceRegistry public immutable registry;

    constructor(address _registry) {
        registry = ServiceRegistry(_registry);
    }

    function execute(bytes calldata data)
        external
        payable
        override
        returns (bytes memory)
    {
        console.log("PULL TOKEN!!!");
        PullTokenData memory pull = abi.decode(data, (PullTokenData));
        // TODO: Use OZ's safeTransferFrom
        IERC20(pull.asset).transferFrom(pull.from, address(this), pull.amount);
        OperationStorage(registry.getRegisteredService("OPERATION_STORAGE"))
            .push("PullToken");
        return "";
    }
}
