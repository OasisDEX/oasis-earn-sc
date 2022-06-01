pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/Action.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/aave/ILendingPool.sol";
import {AAVEWithdrawData} from "../../core/types/Aave.sol";

// TODO: Make it more generic so that anything could be withdrawn and not only ETH
contract WithdrawFromAAVE is Action {
    constructor(ServiceRegistry _registry) Action(_registry) {}

    function execute(bytes calldata data, uint8[] memory)
        external
        payable
        override
    {
        console.log("WithdrawFromAAVE TOKEN!!!");

        push("WithdrawFromAAVE");
        AAVEWithdrawData memory withdraw = abi.decode(data, (AAVEWithdrawData));

        ILendingPool(registry.getRegisteredService("AAVE_LENDING_POOL"))
            .withdraw(withdraw.asset, withdraw.amount, address(this));
        // TODO: Assert that the funds are indeed in the account.
    }
}
