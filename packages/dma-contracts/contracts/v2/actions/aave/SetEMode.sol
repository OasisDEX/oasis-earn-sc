// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../../actions/common/Executable.sol";
import { UseStorageSlot, StorageSlot, Write, Read } from "../../UseStorageSlot.sol";
import { IVariableDebtToken } from "../../../interfaces/aave/IVariableDebtToken.sol";
import { IWETHGateway } from "../../../interfaces/aave/IWETHGateway.sol";
import { ILendingPool } from "../../../interfaces/aave/ILendingPool.sol";
import { SetEModeData } from "../../../core/types/Aave.sol";
import { IPoolV3 } from "../../../interfaces/aaveV3/IPoolV3.sol";

/**
 * @title SetEMode | AAVE V3 Action contract
 * @notice Sets the user's eMode on AAVE's lending pool
 */
contract AaveV3SetEModeV2 is Executable, UseStorageSlot {
  using Write for StorageSlot.TransactionStorage;

  IPoolV3 immutable AAVE_POOL;

  constructor(address _aavePool) {
    AAVE_POOL = IPoolV3(_aavePool);
  }

  /**
   * @param data Encoded calldata that conforms to the SetEModeData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    SetEModeData memory emode = parseInputs(data);

    AAVE_POOL.setUserEMode(emode.categoryId);

    store().write(bytes32(uint256(emode.categoryId)));
  }

  function parseInputs(bytes memory _callData) public pure returns (SetEModeData memory params) {
    return abi.decode(_callData, (SetEModeData));
  }
}
