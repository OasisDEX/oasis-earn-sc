// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { UseStore, Write, Read } from "../common/UseStore.sol";
import { OperationStorage } from "../../core/OperationStorage.sol";
import { PaybackData } from "../../core/types/MorphoBlue.sol";
import { MORPHO_BLUE } from "../../core/constants/MorphoBlue.sol";
import { Id, IMorpho, MarketParams } from "../../interfaces/morpho-blue/IMorpho.sol";
import { MarketParamsLib } from "../../libs/morpho-blue/MarketParamsLib.sol";
import { MorphoLib } from "../../libs/morpho-blue/MorphoLib.sol";
import { SharesMathLib } from "../../libs/morpho-blue/SharesMathLib.sol";

/**
 * @title Payback | MorphoBlue Action contract
 * @notice Pays back a specified amount to Morpho Blue's lending pool
 */
contract MorphoBluePayback is Executable, UseStore {
  using Write for OperationStorage;
  using Read for OperationStorage;
  using MarketParamsLib for MarketParams;
  using MorphoLib for IMorpho;
  using SharesMathLib for uint256;

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @dev Look at UseStore.sol to get additional info on paramsMapping.
   *
   * @param data Encoded calldata that conforms to the PaybackData struct
   * @param paramsMap Maps operation storage values by index (index offset by +1) to execute calldata params
   */
  function execute(bytes calldata data, uint8[] memory paramsMap) external payable override {
    PaybackData memory paybackData = parseInputs(data);

    paybackData.amount = store().readUint(bytes32(paybackData.amount), paramsMap[0], address(this));

    IMorpho morphoBlue = IMorpho(registry.getRegisteredService(MORPHO_BLUE));

    address onBehalf = paybackData.onBehalf == address(0) ? address(this) : paybackData.onBehalf;

    if (paybackData.paybackAll) {
      Id id = paybackData.marketParams.id();

      // Need to call accrueInterest to get the latest snapshot of the shares/asset ratio
      morphoBlue.accrueInterest(paybackData.marketParams);

      uint256 totalBorrowAssets = morphoBlue.totalBorrowAssets(id);
      uint256 totalBorrowShares = morphoBlue.totalBorrowShares(id);
      uint256 shares = morphoBlue.borrowShares(id, onBehalf);
      uint256 assetsMax = shares.toAssetsUp(totalBorrowAssets, totalBorrowShares);

      require(paybackData.amount >= assetsMax, "MorphoBluePayback: payback amount too low");
      paybackData.amount = assetsMax;

      morphoBlue.repay(paybackData.marketParams, 0, shares, onBehalf, bytes(""));
    } else {
      morphoBlue.repay(paybackData.marketParams, paybackData.amount, 0, onBehalf, bytes(""));
    }

    store().write(bytes32(paybackData.amount));
  }

  function parseInputs(bytes memory _callData) public pure returns (PaybackData memory params) {
    return abi.decode(_callData, (PaybackData));
  }
}
