pragma solidity ^0.8.1;
import "hardhat/console.sol";

import "./IAction.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/flashloan/IERC3156FlashBorrower.sol";
import "../../interfaces/flashloan/IERC3156FlashLender.sol";
import "../../libs/DS/DSProxy.sol";
import {OPERATION_EXECUTOR, FLASH_MINT_MODULE, DAI} from "../../core/Constants.sol";

import {FlashloanData} from "../../core/Types.sol";

contract TakeFlashloan is IAction {

    address public constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    constructor(address _registry) IAction(_registry) {}

    function execute(bytes calldata data, uint8[] memory) public payable override {

        DSProxy(payable(address(this))).setOwner(
            registry.getRegisteredService(OPERATION_EXECUTOR)
        );
        FlashloanData memory flData = abi.decode(data, (FlashloanData));
        
        IERC3156FlashLender(registry.getRegisteredService(FLASH_MINT_MODULE))
            .flashLoan(
                IERC3156FlashBorrower(flData.borrower),
                DAI,
                flData.amount,
                data
            );

        DSProxy(payable(address(this))).setOwner(msg.sender);

        storeResult("TakeAFlashloan");
    }
}