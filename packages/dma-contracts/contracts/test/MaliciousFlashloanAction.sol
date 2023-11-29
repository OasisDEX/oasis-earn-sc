// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../contracts/actions/common/Executable.sol";
import { IVault } from "../interfaces/balancer/IVault.sol";
import { IFlashLoanRecipient } from "../interfaces/flashloan/balancer/IFlashLoanRecipient.sol";
import { IERC3156FlashBorrower } from "../interfaces/flashloan/IERC3156FlashBorrower.sol";
import { IERC3156FlashLender } from "../interfaces/flashloan/IERC3156FlashLender.sol";
import { SafeERC20, IERC20 } from "../../contracts/libs/SafeERC20.sol";
import { Call } from "../core/types/Common.sol";
import "hardhat/console.sol";

struct FLData {
  Call[] calls;
}

contract MaliciousFlashloanAction is Executable {
  IERC20 constant DAI = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);
  address immutable OPERATION_EXECUTOR;
  address immutable DSS_FLASH;
  address immutable PROXY_TARGET;

  constructor(address _operationExecutor, address _dssFlash, address _proxyTarget) {
    OPERATION_EXECUTOR = _operationExecutor;
    DSS_FLASH = _dssFlash;
    PROXY_TARGET = _proxyTarget;
  }

  function execute(bytes calldata data, uint8[] memory) external payable override {
    console.log("Taking a malicious flashloan...");
    console.log("Proxy address is:", PROXY_TARGET);
    console.log("Address(this)", address(this));
    IERC20[] memory tokens = new IERC20[](1);
    uint256[] memory amounts = new uint256[](1);

    tokens[0] = DAI;
    amounts[0] = 10 * (10 ** 18); // 10 DAI

    IERC3156FlashLender(DSS_FLASH).flashLoan(
      IERC3156FlashBorrower(OPERATION_EXECUTOR),
      address(DAI),
      10 * (10 ** 18),
      data
    );
  }
}
