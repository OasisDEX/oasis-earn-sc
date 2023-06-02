// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { Write, UseStore, Read } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { DepositBorrowData } from "../../core/types/Ajna.sol";
import {
  AJNA_POOL_UTILS_INFO,
  ERC20_POOL_FACTORY,
  ERC20_NON_SUBSET_HASH
} from "../../core/constants/Ajna.sol";
import { IAjnaPool } from "../../interfaces/ajna/IERC20Pool.sol";
import { IAjnaPoolUtilsInfo } from "../../interfaces/ajna/IAjnaPoolUtilsInfo.sol";
import { IERC20PoolFactory } from "../../interfaces/ajna/IERC20PoolFactory.sol";

/**
 * @title DepositBorrow | Ajna Action contract
 * @notice Deposits collateral and borrows quoite token from Ajna pool
 */
contract AjnaDepositBorrow is Executable, UseStore {
  using Write for OperationStorage;
  using Read for OperationStorage;
  IAjnaPoolUtilsInfo public immutable poolUtilsInfo;
  IERC20PoolFactory public immutable erc20PoolFactory;

  constructor(address _registry) UseStore(_registry) {
    poolUtilsInfo = IAjnaPoolUtilsInfo(registry.getRegisteredService(AJNA_POOL_UTILS_INFO));
    erc20PoolFactory = IERC20PoolFactory(registry.getRegisteredService(ERC20_POOL_FACTORY));
  }

  /**
   * @param data Encoded calldata that conforms to the BorrowData struct
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    DepositBorrowData memory args = parseInputs(data);
    IAjnaPool pool = IAjnaPool(
      erc20PoolFactory.deployedPools(ERC20_NON_SUBSET_HASH, args.collateralToken, args.quoteToken)
    );
    require(address(pool) != address(0), "AjnaDepositBorrow: Pool not found");

    uint256 mappedDepositAmount = store().readUint(
      bytes32(args.depositAmount),
      paramsMap[1],
      address(this)
    );

    uint256 mappedBorrowAmount = store().readUint(
      bytes32(args.borrowAmount),
      paramsMap[2],
      address(this)
    );

    uint256 actualDepositAmount = args.sumDepositAmounts
      ? mappedDepositAmount + args.depositAmount
      : mappedDepositAmount;

    uint256 index = poolUtilsInfo.priceToIndex(args.price);

    pool.drawDebt(
      address(this),
      mappedBorrowAmount * pool.quoteTokenScale(),
      index,
      actualDepositAmount * pool.collateralScale()
    );
    store().write(bytes32(args.depositAmount));
    store().write(bytes32(args.borrowAmount));
  }

  function parseInputs(
    bytes memory _callData
  ) public pure returns (DepositBorrowData memory params) {
    return abi.decode(_callData, (DepositBorrowData));
  }
}
