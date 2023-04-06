// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../common/Executable.sol";
import { UseStore, Write } from "../../common/UseStore.sol";
import { OperationStorage } from "../../../core/OperationStorage.sol";
import { ILendingPool } from "../../../interfaces/aave/ILendingPool.sol";
import { WithdrawData } from "../../../core/types/Aave.sol";
import { AAVE_POOL, AAVE_L2_ENCODER } from "../../../core/constants/Aave.sol";
import { IPoolV3 } from "../../../interfaces/aaveV3/IPoolV3.sol";

/**
 * @title Withdraw | AAVE V3 Action contract
 * @notice Withdraw collateral from AAVE's lending pool
 */
interface IL2Pool {
  function withdraw(bytes32) external;
}

interface IL2Encoder {
  function encodeWithdrawParams(address, uint256) external view returns (bytes32);
}

contract AaveV3L2Withdraw is Executable, UseStore {
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @param data Encoded calldata that conforms to the WithdrawData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    WithdrawData memory withdraw = parseInputs(data);

    IL2Pool(registry.getRegisteredService(AAVE_POOL)).withdraw(
      IL2Encoder(registry.getRegisteredService(AAVE_L2_ENCODER)).encodeWithdrawParams(
        withdraw.asset,
        withdraw.amount
      )
    );

    // TODO: This must beresolved before prod. L2Pool.withdraw doesn't return the final amount being withdrawn
    // The value stored in the storage and the one used in the event MUST be changed!
    store().write(bytes32(withdraw.amount));
  }

  function parseInputs(bytes memory _callData) public pure returns (WithdrawData memory params) {
    return abi.decode(_callData, (WithdrawData));
  }
}
