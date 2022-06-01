pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "./Action.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import {PullTokenData} from "../../core/types/Common.sol";

contract PullToken is Action {
    constructor(ServiceRegistry _registry) Action(_registry) {}

    function execute(bytes calldata data, uint8[] memory)
        external
        payable
        override
    {
        console.log("PULL TOKEN!!!");
        PullTokenData memory pull = abi.decode(data, (PullTokenData));
        // TODO: Use OZ's safeTransferFrom
        IERC20(pull.asset).transferFrom(pull.from, address(this), pull.amount);
        push("PullToken");
    }
}
