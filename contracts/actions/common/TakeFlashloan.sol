pragma solidity ^0.8.1;

import { Executable } from "../common/Executable.sol";
import { ServiceRegistry } from "../../core/ServiceRegistry.sol";
import { IERC3156FlashBorrower } from "../../interfaces/flashloan/IERC3156FlashBorrower.sol";
import { IERC3156FlashLender } from "../../interfaces/flashloan/IERC3156FlashLender.sol";
import { DSProxy } from "../../libs/DS/DSProxy.sol";
import { FlashloanData } from "../../core/types/Common.sol";
import { OPERATION_EXECUTOR, DAI } from "../../core/constants/Common.sol";
import { FLASH_MINT_MODULE } from "../../core/constants/Maker.sol";

contract TakeFlashloan is Executable {
  ServiceRegistry internal immutable registry;

  constructor(ServiceRegistry _registry) {
    registry = _registry;
  }

  function execute(bytes calldata data, uint8[] memory) external payable override {
    DSProxy proxy = DSProxy(payable(address(this)));
    proxy.setOwner(registry.getRegisteredService(OPERATION_EXECUTOR));

    FlashloanData memory flData = abi.decode(data, (FlashloanData));
    IERC3156FlashLender(registry.getRegisteredService(FLASH_MINT_MODULE)).flashLoan(
      IERC3156FlashBorrower(flData.borrower),
      registry.getRegisteredService(DAI),
      flData.amount,
      data
    );

    proxy.setOwner(msg.sender);
  }
}
