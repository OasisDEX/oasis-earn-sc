// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../../actions/common/Executable.sol";
import { IVault } from "../../../interfaces/balancer/IVault.sol";
import { IERC3156FlashBorrower } from "../../../interfaces/flashloan/IERC3156FlashBorrower.sol";
import { IERC3156FlashLender } from "../../../interfaces/flashloan/IERC3156FlashLender.sol";
import {
  IFlashLoanRecipient
} from "../../../interfaces/flashloan/balancer/IFlashLoanRecipient.sol";
import { FlashloanData, FlashloanProvider } from "../../../core/types/Common.sol";
import { ChainLogView } from "../../../core/views/ChainLogView.sol";
import { ProxyPermission } from "../../../libs/DS/ProxyPermission.sol";
import { IERC20 } from "../../../libs/SafeERC20.sol";
import { MCD_FLASH } from "../../../core/constants/Maker.sol";

/**
 * @title TakeFlashloan Action contract
 * @notice Executes a sequence of Actions after flashloaning funds
 */
contract TakeFlashloanV2 is Executable, ProxyPermission {
  address internal immutable DAI;
  address immutable OPERATION_EXECUTOR;
  IVault immutable BALANCER_VAULT;
  ChainLogView immutable CHAINLOG_VIEWER;

  constructor(
    address _balancerVault,
    address _operationExecutor,
    address _chainLogViewer,
    address _dai,
    address _dsGuardFactory
  ) ProxyPermission(_dsGuardFactory) {
    BALANCER_VAULT = IVault(_balancerVault);
    OPERATION_EXECUTOR = _operationExecutor;
    CHAINLOG_VIEWER = ChainLogView(_chainLogViewer);
    DAI = _dai;
  }

  /**
   * @dev When the Flashloan lender calls back the Operation Executor we may need to re-establish the calling context.
   * @dev The isProxyFlashloan flag is used to give the Operation Executor temporary authority to call the execute method on a user"s proxy. Refers to any proxy wallet (DSProxy or DPMProxy at time of writing)
   * @dev isDPMProxy flag switches between regular DSPRoxy and DPMProxy
   * @param data Encoded calldata that conforms to the FlashloanData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    FlashloanData memory flData = parseInputs(data);

    if (flData.isProxyFlashloan) {
      givePermission(flData.isDPMProxy, OPERATION_EXECUTOR);
    }

    if (flData.provider == FlashloanProvider.DssFlash) {
      IERC3156FlashLender(CHAINLOG_VIEWER.getServiceAddress(MCD_FLASH)).flashLoan(
        IERC3156FlashBorrower(OPERATION_EXECUTOR),
        DAI,
        flData.amount,
        abi.encode(flData, address(this))
      );
    }

    if (flData.provider == FlashloanProvider.Balancer) {
      IERC20[] memory tokens = new IERC20[](1);
      uint256[] memory amounts = new uint256[](1);

      tokens[0] = IERC20(flData.asset);
      amounts[0] = flData.amount;

      BALANCER_VAULT.flashLoan(
        IFlashLoanRecipient(OPERATION_EXECUTOR),
        tokens,
        amounts,
        abi.encode(flData, address(this))
      );
    }

    if (flData.isProxyFlashloan) {
      removePermission(flData.isDPMProxy, OPERATION_EXECUTOR);
    }
  }

  function parseInputs(bytes memory _callData) public pure returns (FlashloanData memory params) {
    return abi.decode(_callData, (FlashloanData));
  }
}
