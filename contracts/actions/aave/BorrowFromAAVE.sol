pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/Action.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/aave/IVariableDebtToken.sol";
import "../../interfaces/aave/IWETHGateway.sol";
import {AAVEBorrowData} from "../../core/types/Aave.sol";

// TODO: Make it more generic so that anything could be withdrawn and not only ETH
contract BorrowFromAAVE is Action {
    constructor(ServiceRegistry _registry) Action(_registry) {}

    // This will be removed once I make it more generic
    IVariableDebtToken public constant dWETH =
        IVariableDebtToken(0xF63B34710400CAd3e044cFfDcAb00a0f32E33eCf);

    function execute(bytes calldata data, uint8[] memory)
        external
        payable
        override
    {
        console.log("BorrowFromAAVE TOKEN!!!");
        push("BorrowFromAAVE");
        AAVEBorrowData memory borrow = abi.decode(data, (AAVEBorrowData));
        address wethGatewayAddress = registry.getRegisteredService(
            "AAVE_WETH_GATEWAY"
        );
        dWETH.approveDelegation(wethGatewayAddress, borrow.amount);
        IWETHGateway(wethGatewayAddress).borrowETH(
            registry.getRegisteredService("AAVE_LENDING_POOL"),
            borrow.amount,
            2,
            0
        );
    }
}
