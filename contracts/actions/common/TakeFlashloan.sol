pragma solidity ^0.8.1;

import { Executable } from "../common/Executable.sol";
import { ServiceRegistry } from "../../core/ServiceRegistry.sol";
import { IERC3156FlashBorrower } from "../../interfaces/flashloan/IERC3156FlashBorrower.sol";
import { IERC3156FlashLender } from "../../interfaces/flashloan/IERC3156FlashLender.sol";
import { FlashloanData } from "../../core/types/Common.sol";
import { OPERATION_EXECUTOR, DAI } from "../../core/constants/Common.sol";
import { FLASH_MINT_MODULE } from "../../core/constants/Maker.sol";
import { ProxyPermission } from "../../libs/DS/ProxyPermission.sol";

contract TakeFlashloan is Executable, ProxyPermission {
  ServiceRegistry internal immutable registry;

  constructor(ServiceRegistry _registry) {
    registry = _registry;
  }

  function execute(bytes calldata data, uint8[] memory) external payable override {
    FlashloanData memory flData = abi.decode(data, (FlashloanData));

    if (flData.dsProxyFlashloan) {
      givePermission(registry.getRegisteredService(OPERATION_EXECUTOR));
    }

    IERC3156FlashLender(registry.getRegisteredService(FLASH_MINT_MODULE)).flashLoan(
      IERC3156FlashBorrower(flData.borrower),
      registry.getRegisteredService(DAI),
      flData.amount,
      data
    );

    if (flData.dsProxyFlashloan) {
      removePermission(registry.getRegisteredService(OPERATION_EXECUTOR));
    }
  }
}
