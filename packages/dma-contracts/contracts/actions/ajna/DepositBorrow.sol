// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { Write, UseStore } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { DepositBorrowData } from "../../core/types/Ajna.sol";
import { AJNA_POOL_UTILS_INFO } from "../../core/constants/Ajna.sol";
import { IAjnaPool } from "../../interfaces/ajna/IERC20Pool.sol";
import { IAjnaPoolUtilsInfo } from "../../interfaces/ajna/IAjnaPoolUtilsInfo.sol";

/**
 * @title DepositBorrow | Ajna Action contract
 * @notice Deposits collateral and borrows quoite token from Ajna pool
 */
contract AjnaDepositBorrow is Executable, UseStore {
  using Write for OperationStorage;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @param data Encoded calldata that conforms to the BorrowData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    DepositBorrowData memory args = parseInputs(data);
    IAjnaPool pool = IAjnaPool(args.pool);
    IAjnaPoolUtilsInfo poolUtilsInfo = IAjnaPoolUtilsInfo(registry.getRegisteredService(AJNA_POOL_UTILS_INFO));

    uint256 index = poolUtilsInfo.priceToIndex(args.price);

    pool.drawDebt(address(this), args.borrowAmount * pool.quoteTokenScale(), index, args.depositAmount * pool.collateralScale());
    store().write(bytes32(args.depositAmount));
    store().write(bytes32(args.borrowAmount));
  }

  function parseInputs(bytes memory _callData) public pure returns (DepositBorrowData memory params) {
    return abi.decode(_callData, (DepositBorrowData));
  }
}
