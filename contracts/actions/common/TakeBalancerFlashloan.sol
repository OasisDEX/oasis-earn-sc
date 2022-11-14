pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { ServiceRegistry } from "../../core/ServiceRegistry.sol";
import { IERC3156FlashBorrower } from "../../interfaces/flashloan/IERC3156FlashBorrower.sol";
import { IERC3156FlashLender } from "../../interfaces/flashloan/IERC3156FlashLender.sol";
import { IFlashLoanRecipient } from "../../interfaces/flashloan/balancer/IFlashLoanRecipient.sol";
import { IVault } from "../../interfaces/balancer/IVault.sol";
import { IERC20 } from "../../interfaces/tokens/IERC20.sol";
import { FlashloanData } from "../../core/types/Common.sol";
import { OPERATION_EXECUTOR, DAI, TAKE_BALANCER_FLASH_LOAN_ACTION } from "../../core/constants/Common.sol";
import { FLASH_MINT_MODULE } from "../../core/constants/Maker.sol";
import { ProxyPermission } from "../../libs/DS/ProxyPermission.sol";

/**
 * @title TakeFlashloan Action contract
 * @notice Executes a sequence of Actions after flashloaning funds
 */
contract TakeBalancerFlashloan is Executable, ProxyPermission {
  ServiceRegistry internal immutable registry;
  address internal immutable dai;

  address internal immutable balancerVault;

  constructor(ServiceRegistry _registry, address _dai, address _balancerVault) {
    registry = _registry;
    dai = _dai;
    balancerVault = _balancerVault;
  }

  /**
   * @dev When the Flashloan lender calls back the Operation Executor we may need to re-establish the calling context.
   * @dev The dsProxyFlashloan flag is used to give the Operation Executor temporary authority to call the execute method on a user's proxy
   * @param data Encoded calldata that conforms to the FlashloanData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    FlashloanData memory flData = parseInputs(data);

    address operationExecutorAddress = registry.getRegisteredService(OPERATION_EXECUTOR);

    if (flData.dsProxyFlashloan) {
      givePermission(operationExecutorAddress);
    }

    IERC20[] memory tokens = new IERC20[](1);
    uint256[] memory amounts = new uint256[](1);

    tokens[0] = IERC20(dai);
    amounts[0] = flData.amount;

    IVault(balancerVault).flashLoan(
      IFlashLoanRecipient(operationExecutorAddress),
      tokens,
      amounts,
      data
    );

    if (flData.dsProxyFlashloan) {
      removePermission(operationExecutorAddress);
    }

    emit Action(TAKE_BALANCER_FLASH_LOAN_ACTION, bytes32(flData.amount));
  }

  function parseInputs(bytes memory _callData) public pure returns (FlashloanData memory params) {
    return abi.decode(_callData, (FlashloanData));
  }
}