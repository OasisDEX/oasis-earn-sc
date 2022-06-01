pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/Action.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/aave/ILendingPool.sol";
import {AAVEDepositData} from "../../core/types/Aave.sol";

contract DepositInAAVE is Action {
    constructor(ServiceRegistry _registry) Action(_registry) {}

    function execute(bytes calldata data, uint8[] memory)
        external
        payable
        override
    {
        console.log("DepositInAAVE TOKEN!!!");
        push("DepositInAAVE");
        AAVEDepositData memory deposit = abi.decode(data, (AAVEDepositData));
        // TODO: Check if the asses could be deposited to the pool
        ILendingPool(registry.getRegisteredService("AAVE_LENDING_POOL"))
            .deposit(deposit.asset, deposit.amount, address(this), 0);
        // TODO: verify if I received the amount in the give aToken
    }
}
