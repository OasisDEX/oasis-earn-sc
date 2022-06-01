pragma solidity ^0.8.1;
import "hardhat/console.sol";

import "./Action.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/flashloan/IERC3156FlashBorrower.sol";
import "../../interfaces/flashloan/IERC3156FlashLender.sol";
import "../../libs/DS/DSProxy.sol";
import {FlashloanData} from "../../core/types/Common.sol";

contract TakeFlashloan is Action {
    constructor(ServiceRegistry _registry) Action(_registry) {}

    function execute(bytes calldata data, uint8[] memory)
        public
        payable
        override
    {
        console.log("PULL TOKEN!!!");
        DSProxy(payable(address(this))).setOwner(
            registry.getRegisteredService("OPERATION_EXECUTOR")
        );

        OperationStorage txStorage = OperationStorage(
            registry.getRegisteredService("OPERATION_STORAGE")
        );
        txStorage.push("TakeAFlashloan");
        FlashloanData memory flData = abi.decode(data, (FlashloanData));
        IERC3156FlashLender(registry.getRegisteredService("FLASH_MINT_MODULE"))
            .flashLoan(
                IERC3156FlashBorrower(flData.borrower),
                registry.getRegisteredService("DAI"),
                flData.amount,
                data
            );

        DSProxy(payable(address(this))).setOwner(msg.sender);
    }
}
