pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/Executable.sol";
import { UseStore, Write } from "../common/UseStore.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/aave/ILendingPool.sol";
import { DepositData } from "../../core/types/Aave.sol";
import { AAVE_LENDING_POOL } from "../../core/constants/Aave.sol";

contract AaveDeposit is Executable, UseStore {
  using Write for OperationStorage;

  // TODO: Pass the service registry in here
  constructor(address _registry) UseStore(_registry) {}

  function execute(bytes calldata data, uint8[] memory) external payable override {
    DepositData memory deposit = abi.decode(data, (DepositData));
    store().write(bytes32(deposit.amount));
    // TODO: Check if the asses could be deposited to the pool
    ILendingPool(registry.getRegisteredService(AAVE_LENDING_POOL)).deposit(
      deposit.asset,
      deposit.amount,
      address(this),
      0
    );
    // TODO: verify if I received the amount in the give aToken
  }
}
