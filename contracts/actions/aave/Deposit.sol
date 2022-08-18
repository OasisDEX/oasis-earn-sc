pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { UseStore, Write, Read } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { ILendingPool } from "../../interfaces/aave/ILendingPool.sol";
import { DepositData } from "../../core/types/Aave.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { AAVE_LENDING_POOL, DEPOSIT_ACTION } from "../../core/constants/Aave.sol";

contract AaveDeposit is Executable, UseStore {
  using Write for OperationStorage;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    DepositData memory deposit = abi.decode(data, (DepositData));

    store().write(bytes32(deposit.amount));
    deposit.amount = store().readUint(bytes32(deposit.amount), paramsMap[1], address(this));//TODO: blind guess here
    //maybe that should be in data, since if might be first after FL

    ILendingPool(registry.getRegisteredService(AAVE_LENDING_POOL)).deposit(
      deposit.asset,
      deposit.amount,
      address(this),
      0
    );
  
    emit Action(DEPOSIT_ACTION, bytes32(deposit.amount));
  }
}
