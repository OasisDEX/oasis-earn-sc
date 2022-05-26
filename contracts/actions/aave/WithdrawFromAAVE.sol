pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/IAction.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/aave/ILendingPool.sol";
import {AAVEWithdrawData} from "../../core/Types.sol";

// TODO: Make it more generic so that anything could be withdrawn and not only ETH
contract WithdrawFromAAVE is IAction {
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
        console.log("WithdrawFromAAVE TOKEN!!!");
        OperationStorage txStorage = OperationStorage(
            registry.getRegisteredService("OPERATION_STORAGE")
        );
        txStorage.push("WithdrawFromAAVE");
        AAVEWithdrawData memory withdraw = abi.decode(data, (AAVEWithdrawData));

        ILendingPool(registry.getRegisteredService("AAVE_LENDING_POOL"))
            .withdraw(withdraw.asset, withdraw.amount, address(this));
        // TODO: Assert that the funds are indeed in the account.
        return "";
    }
}
