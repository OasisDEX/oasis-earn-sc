pragma solidity ^0.8.1;
import "hardhat/console.sol";

import "../common/IAction.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/flashloan/IERC3156FlashBorrower.sol";
import "../../interfaces/flashloan/IERC3156FlashLender.sol";
import "../../libs/DS/DSProxy.sol";
import {FlashloanData} from "../../core/Types.sol";
import {OPERATION_EXECUTOR, FLASH_MINT_MODULE, DAI} from "../../core/Constants.sol";

contract TakeFlashloan is IAction {
    constructor(address _registry) IAction(_registry) {}

    function execute(bytes calldata data) public payable override {
        DSProxy(payable(address(this))).setOwner(
            registry.getRegisteredService(OPERATION_EXECUTOR)
        );
        FlashloanData memory flData = abi.decode(data, (FlashloanData));
        IERC3156FlashLender(registry.getRegisteredService(FLASH_MINT_MODULE))
            .flashLoan(
                IERC3156FlashBorrower(flData.borrower),
                registry.getRegisteredService(DAI),
                flData.amount,
                data
            );

        DSProxy(payable(address(this))).setOwner(msg.sender);

        storeResult("TakeAFlashloan");
    }
}
