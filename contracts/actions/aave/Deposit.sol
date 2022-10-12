pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { UseStore, Write, Read } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { ILendingPool } from "../../interfaces/aave/ILendingPool.sol";
import { DepositData } from "../../core/types/Aave.sol";
import { SafeERC20, IERC20 } from "../../libs/SafeERC20.sol";
import { AAVE_LENDING_POOL, DEPOSIT_ACTION } from "../../core/constants/Aave.sol";

/**
 * @title Deposit | AAVE Action contract
 * @notice Deposits the specified asset as collateral on AAVE's lending pool
 */
contract AaveDeposit is Executable, UseStore {
  using Write for OperationStorage;
  using Read for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @dev Look at UseStore.sol to get additional info on paramsMapping
   * @param data Encoded calldata that conforms to the DepositData struct
   * @param paramsMap Maps operation storage values by index (index offset by +1) to execute calldata params
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    DepositData memory deposit = parseInputs(data);

    deposit.amount = store().readUint(bytes32(deposit.amount), paramsMap[1], address(this));

    ILendingPool(registry.getRegisteredService(AAVE_LENDING_POOL)).deposit(
      deposit.asset,
      deposit.amount,
      address(this),
      0
    );

    store().write(bytes32(deposit.amount));
    emit Action(DEPOSIT_ACTION, bytes32(deposit.amount));
  }

  function parseInputs(bytes memory _callData) public pure returns (DepositData memory params) {
    return abi.decode(_callData, (DepositData));
  }
}
