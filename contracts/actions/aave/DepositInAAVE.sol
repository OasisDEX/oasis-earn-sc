pragma solidity ^0.8.1;
// TODO: Remove this for prod deploy
import "hardhat/console.sol";

import "../common/Executable.sol";
import "../common/UsingStorageValues.sol";
import "../../core/ServiceRegistry.sol";
import "../../core/OperationStorage.sol";
import "../../interfaces/aave/ILendingPool.sol";
import { AAVEDepositData } from "../../core/Types.sol";
import { OPERATION_STORAGE, AAVE_LENDING_POOL } from "../../core/Constants.sol";

contract DepositInAAVE is Executable, UsingStorageValues {
  // TODO: Pass the service registry in here
  constructor(address _registry) UsingStorageValues(_registry) {}

  function execute(bytes calldata data) external payable override {
    AAVEDepositData memory deposit = abi.decode(data, (AAVEDepositData));
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
