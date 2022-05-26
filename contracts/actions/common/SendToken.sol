pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/IAction.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import {SendTokenData} from "../../core/Types.sol";

// TODO: Be able to differentiate between ETH and ERC20 tokens
contract SendToken is IAction {
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
        console.log("SendToken TOKEN!!!");
        OperationStorage txStorage = OperationStorage(
            registry.getRegisteredService("OPERATION_STORAGE")
        );
        txStorage.push("SendToken");
        SendTokenData memory send = abi.decode(data, (SendTokenData));
        // TODO: Use OZ's safeTransfer
        IERC20(send.asset).transfer(send.to, send.amount);

        return "";
    }
}
