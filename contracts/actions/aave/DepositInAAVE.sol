pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/IAction.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/aave/ILendingPool.sol";
import {AAVEDepositData} from "../../core/Types.sol";

contract DepositInAAVE is IAction {
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
        console.log("DepositInAAVE TOKEN!!!");
        OperationStorage txStorage = OperationStorage(
            registry.getRegisteredService("OPERATION_STORAGE")
        );
        txStorage.push("DepositInAAVE");
        AAVEDepositData memory deposit = abi.decode(data, (AAVEDepositData));
        // TODO: Check if the asses could be deposited to the pool
        ILendingPool(registry.getRegisteredService("AAVE_LENDING_POOL"))
            .deposit(deposit.asset, deposit.amount, address(this), 0);
        // TODO: verify if I received the amount in the give aToken
        return "";
    }
}
