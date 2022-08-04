pragma solidity ^0.8.1;

import { Executable } from "../common/Executable.sol";
import { Write, UseStore } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { IVariableDebtToken } from "../../interfaces/aave/IVariableDebtToken.sol";
import { IWETHGateway } from "../../interfaces/aave/IWETHGateway.sol";
import { PaybackData } from "../../core/types/Aave.sol";
import { ILendingPool } from "../../interfaces/aave/ILendingPool.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";

import { AAVE_WETH_GATEWAY, AAVE_LENDING_POOL, PAYBACK_ACTION } from "../../core/constants/Aave.sol";

import "hardhat/console.sol";
contract AavePayback is Executable, UseStore {
  using Write for OperationStorage;

  // solhint-disable-next-line
  uint256 public constant UINT_MAX_VALUE = type(uint256).max;

  IVariableDebtToken public constant dWETH = IVariableDebtToken(0xF63B34710400CAd3e044cFfDcAb00a0f32E33eCf);

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory) external payable override {
    PaybackData memory payback = parseInputs(data);

    console.log('PAYING BACK', payback.amount );

    console.log('WETH BAL1', IERC20(payback.asset).balanceOf(address(this)) );
    
    ILendingPool(registry.getRegisteredService(AAVE_LENDING_POOL)).repay(
      payback.asset,
      payback.amount,
      2,
      address(this)
    );

    console.log('PB DONE'  );
    console.log('WETH BAL2', IERC20(payback.asset).balanceOf(address(this)) );

    store().write(bytes32(payback.amount));

    }

function parseInputs(bytes memory _callData) public pure returns (PaybackData memory params) {
    return abi.decode(_callData, (PaybackData));
  }
}