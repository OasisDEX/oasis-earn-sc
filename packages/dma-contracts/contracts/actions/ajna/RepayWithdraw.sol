// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { Write, UseStore } from "../common/UseStore.sol";
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

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @param data Encoded calldata that conforms to the BorrowData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    RepayWithdrawData memory args = parseInputs(data);
    IAjnaPool pool = IAjnaPool(args.pool);
    IAjnaPoolUtilsInfo poolUtilsInfo = IAjnaPoolUtilsInfo(
      registry.getRegisteredService(AJNA_POOL_UTILS_INFO)
    );

    uint256 index = poolUtilsInfo.priceToIndex(args.price);

    pool.repayDebt(
      address(this),
      args.repayAmount * pool.quoteTokenScale(),
      args.withdrawAmount * pool.collateralScale(),
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
