// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { Write, UseStore, Read } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { RepayWithdrawData } from "../../core/types/Ajna.sol";
import { AJNA_POOL_UTILS_INFO } from "../../core/constants/Ajna.sol";
import { IAjnaPool } from "../../interfaces/ajna/IERC20Pool.sol";
import { IAjnaPoolUtilsInfo } from "../../interfaces/ajna/IAjnaPoolUtilsInfo.sol";

/**
 * @title AjnaRepayWithdraw | Ajna Action contract
 * @notice Repays quotetokens and withdraws collateral from Ajna pool
 */
contract AjnaRepayWithdraw is Executable, UseStore {
  using Write for OperationStorage;
  using Read for OperationStorage;
  IAjnaPoolUtilsInfo immutable public poolUtilsInfo;

  constructor(address poolUtilsInfoAddress, address _registry) UseStore(_registry) {
    poolUtilsInfo = IAjnaPoolUtilsInfo(poolUtilsInfoAddress);
  }

  /**
   * @param data Encoded calldata that conforms to the BorrowData struct
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    RepayWithdrawData memory args = parseInputs(data);
    IAjnaPool pool = IAjnaPool(args.pool);

    args.withdrawAmount = store().readUint(bytes32(args.withdrawAmount), paramsMap[1], address(this));
    args.repayAmount = store().readUint(bytes32(args.repayAmount), paramsMap[2], address(this));

    uint256 index = poolUtilsInfo.priceToIndex(args.price);

    (uint256 debt,uint256 collateral, ) = poolUtilsInfo.borrowerInfo(address(pool), address(this));
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

    pool.repayDebt(address(this), args.repayAmount * quoteTokenScale, args.withdrawAmount * collateralScale, address(this), index);
    
    store().write(bytes32(args.repayAmount));
    store().write(bytes32(args.withdrawAmount));
  }

  function parseInputs(bytes memory _callData) public pure returns (RepayWithdrawData memory params) {
    return abi.decode(_callData, (RepayWithdrawData));
  }
}
