pragma solidity ^0.8.1;

import { Executable } from "../common/Executable.sol";
import { UseStore, Write } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { ILendingPool } from "../../interfaces/aave/ILendingPool.sol";
import { DepositData } from "../../core/types/Aave.sol";
import { AAVE_LENDING_POOL, DEPOSIT_ACTION } from "../../core/constants/Aave.sol";

contract AaveDeposit is Executable, UseStore {
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory) external payable override {
    DepositData memory deposit = abi.decode(data, (DepositData));
    store().write(bytes32(deposit.amount));
    ILendingPool(registry.getRegisteredService(AAVE_LENDING_POOL)).deposit(
      deposit.asset,
      deposit.amount,
      address(this),
      0
    );
    emit Action(DEPOSIT_ACTION, bytes32(deposit.amount));
  }
}
