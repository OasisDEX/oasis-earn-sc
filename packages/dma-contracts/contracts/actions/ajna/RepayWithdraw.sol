// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { Write, UseStore, Read } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { RepayWithdrawData } from "../../core/types/Ajna.sol";
import {
  AJNA_POOL_UTILS_INFO,
  ERC20_POOL_FACTORY,
  ERC20_NON_SUBSET_HASH
} from "../../core/constants/Ajna.sol";
import { IAjnaPool } from "../../interfaces/ajna/IERC20Pool.sol";
import { IAjnaPoolUtilsInfo } from "../../interfaces/ajna/IAjnaPoolUtilsInfo.sol";
import { IERC20PoolFactory } from "../../interfaces/ajna/IERC20PoolFactory.sol";

/**
 * @title AjnaRepayWithdraw | Ajna Action contract
 * @notice Repays quotetokens and withdraws collateral from Ajna pool
 */
contract AjnaRepayWithdraw is Executable, UseStore {
  using Write for OperationStorage;
  using Read for OperationStorage;
  IAjnaPoolUtilsInfo public immutable poolUtilsInfo;
  IERC20PoolFactory public immutable erc20PoolFactory;

  constructor(address _registry) UseStore(_registry) {
    address poolUtilsInfoAddress = registry.getRegisteredService(AJNA_POOL_UTILS_INFO);
    require(poolUtilsInfoAddress != address(0), "AjnaDepositBorrow: PoolUtilsInfo not found");
    address erc20PoolFactoryAddress = registry.getRegisteredService(ERC20_POOL_FACTORY);
    require(erc20PoolFactoryAddress != address(0), "AjnaDepositBorrow: PoolFactory not found");
    poolUtilsInfo = IAjnaPoolUtilsInfo(poolUtilsInfoAddress);
    erc20PoolFactory = IERC20PoolFactory(erc20PoolFactoryAddress);
  }

  /**
   * @param data Encoded calldata that conforms to the BorrowData struct
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    RepayWithdrawData memory args = parseInputs(data);
    IAjnaPool pool = IAjnaPool(
      erc20PoolFactory.deployedPools(ERC20_NON_SUBSET_HASH, args.collateralToken, args.quoteToken)
    );
    require(address(pool) != address(0), "AjnaDepositBorrow: Pool not found");

    args.withdrawAmount = store().readUint(
      bytes32(args.withdrawAmount),
      paramsMap[1],
      address(this)
    );
    args.repayAmount = store().readUint(bytes32(args.repayAmount), paramsMap[2], address(this));

    uint256 index = poolUtilsInfo.priceToIndex(args.price);

    (uint256 debt, uint256 collateral, ) = poolUtilsInfo.borrowerInfo(address(pool), address(this));
    uint256 quoteTokenScale = pool.quoteTokenScale();
    uint256 collateralScale = pool.collateralScale();

    if (args.paybackAll) {
      uint256 amountDebt = ((debt / quoteTokenScale) + 1);
      args.repayAmount = amountDebt;
    }

    if (args.withdrawAll) {
      uint256 amountCollateral = collateral / collateralScale;
      args.withdrawAmount = amountCollateral;
    }

    pool.repayDebt(
      address(this),
      args.repayAmount * quoteTokenScale,
      args.withdrawAmount * collateralScale,
      address(this),
      index
    );

    store().write(bytes32(args.repayAmount));
    store().write(bytes32(args.withdrawAmount));
  }

  function parseInputs(
    bytes memory _callData
  ) public pure returns (RepayWithdrawData memory params) {
    return abi.decode(_callData, (RepayWithdrawData));
  }
}
