pragma solidity ^0.8.1;

import "../common/Executable.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/tokens/IERC20.sol";
import "../../interfaces/aave/ILendingPool.sol";
import { WithdrawData } from "../../core/types/Aave.sol";
import { UseStore, Write, Read } from "../common/UseStore.sol";

import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";

import { AAVE_LENDING_POOL, WITHDRAW_ACTION } from "../../core/constants/Aave.sol";

contract AaveWithdraw is Executable, UseStore {
  using Write for OperationStorage;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory) external payable override {
    console.log('WITHDRAW START' );
    
    WithdrawData memory withdraw = parseInputs(data);
    
    console.log('WITHDRAWING' );
    
    ILendingPool(registry.getRegisteredService(AAVE_LENDING_POOL)).withdraw(
      withdraw.asset,
      withdraw.amount,
      address(this)
    );

    if( withdraw.amount == type(uint256).max) {
      withdraw.amount = IERC20(withdraw.asset).balanceOf(address(this));
    }
    console.log('WITHDRAWN AMOUNT', withdraw.amount);
    
    store().write(bytes32(withdraw.amount));
    emit Action(WITHDRAW_ACTION, bytes32(withdraw.amount));
  }

  function parseInputs(bytes memory _callData) public pure returns (WithdrawData memory params) {
    return abi.decode(_callData, (WithdrawData));
  }
}
