// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../../common/Executable.sol";
import { Write, UseStore } from "../../common/UseStore.sol";
import { OperationStorage } from "../../../core/OperationStorage.sol";
import { IVariableDebtToken } from "../../../interfaces/aave/IVariableDebtToken.sol";
import { IWETHGateway } from "../../../interfaces/aave/IWETHGateway.sol";
import { ILendingPool } from "../../../interfaces/aave/ILendingPool.sol";
import { BorrowData } from "../../../core/types/Aave.sol";
import { AAVE_POOL, AAVE_L2_ENCODER } from "../../../core/constants/Aave.sol";
import { IPoolV3 } from "../../../interfaces/aaveV3/IPoolV3.sol";

/**
 * @title Borrow | AAVE V3 Action contract
 * @notice Borrows token from AAVE's lending pool
 */
interface IL2Pool {
  function borrow(bytes32 args) external;
}

interface IL2Encoder {
  function encodeBorrowParams(address, uint256, uint256, uint16) external view returns (bytes32);
}

contract AaveV3L2Borrow is Executable, UseStore {
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @param data Encoded calldata that conforms to the BorrowData struct
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    BorrowData memory borrow = parseInputs(data);

    uint256 mappedBorrowAmount = store().readUint(
      bytes32(borrow.amount),
      paramsMap[1],
      address(this)
    );

    IL2Pool(registry.getRegisteredService(AAVE_POOL)).borrow(
      IL2Encoder(registry.getRegisteredService(AAVE_L2_ENCODER)).encodeBorrowParams(
        borrow.asset,
        mappedBorrowAmount,
        2,
        0
      )
    );

    store().write(bytes32(mappedBorrowAmount));
  }

  function parseInputs(bytes memory _callData) public pure returns (BorrowData memory params) {
    return abi.decode(_callData, (BorrowData));
  }
}
