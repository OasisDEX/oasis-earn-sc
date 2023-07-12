// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../common/Executable.sol";
import { UseStore, Write, Read } from "../../common/UseStore.sol";
import { OperationStorage } from "../../../core/OperationStorage.sol";
import { IPoolV3 } from "../../../interfaces/aaveV3/IPoolV3.sol";
import { DepositData } from "../../../core/types/Aave.sol";

import { AAVE_POOL, AAVE_L2_ENCODER } from "../../../core/constants/Aave.sol";

/**
 * @title Deposit | AAVE V3 Action contract
 * @notice Deposits the specified asset as collateral on AAVE's lending pool
 */

interface IL2Pool {
  function supply(bytes32) external;

  function setUserUseReserveAsCollateral(bytes32) external;
}

interface IL2Encoder {
  function encodeSupplyParams(address, uint256, uint16) external view returns (bytes32);

  function encodeSetUserUseReserveAsCollateral(address, bool) external view returns (bytes32);
}

contract AaveV3L2Deposit is Executable, UseStore {
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

    uint256 mappedDepositAmount = store().readUint(
      bytes32(deposit.amount),
      paramsMap[1],
      address(this)
    );

    uint256 actualDepositAmount = deposit.sumAmounts
      ? mappedDepositAmount + deposit.amount
      : mappedDepositAmount;

    IL2Pool(registry.getRegisteredService(AAVE_POOL)).supply(
      IL2Encoder(registry.getRegisteredService(AAVE_L2_ENCODER)).encodeSupplyParams(
        deposit.asset,
        actualDepositAmount,
        0
      )
    );

    if (deposit.setAsCollateral) {
      IL2Pool(registry.getRegisteredService(AAVE_POOL)).setUserUseReserveAsCollateral(
        IL2Encoder(registry.getRegisteredService(AAVE_L2_ENCODER))
          .encodeSetUserUseReserveAsCollateral(deposit.asset, true)
      );
    }

    store().write(bytes32(actualDepositAmount));
  }

  function parseInputs(bytes memory _callData) public pure returns (DepositData memory params) {
    return abi.decode(_callData, (DepositData));
  }

  receive() external payable {}
}
