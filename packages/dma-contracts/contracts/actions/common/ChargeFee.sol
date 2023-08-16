// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.15;

import { Executable } from "../common/Executable.sol";
import { ChargeFeeData } from "../../core/types/Common.sol";
import { UseStore, Write } from "../../actions/common/UseStore.sol";
import { BACKEND_MSG_SIGNER, ORACLE_ADAPTER } from "../../core/constants/Common.sol";
import "../../core/types/Common.sol";

import { PercentageUtils } from "../../libs/PercentageUtils.sol";
import { PriceUtils } from "../../libs/PriceUtils.sol";

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { IOracleAdapter } from "../../interfaces/common/IOracleAdapter.sol";
import { USD } from "../../interfaces/common/IOracleAdapter.sol";

/**
 * @title ChargeFee Action contract
 * @notice Action used to charge the AUM fee for a position. It will validate the data passed from the executor that
 *         must be signed by the backend. Then it will verify that the passed fee amount does not exceed the maximum
 *         configured. In order to do this it will consult the necessary Chainlink oracles to obtain the current net
 *         worth of the position and then apply a configured maximum fee percentage to obtain the cap.
 */
contract ChargeFee is Executable, UseStore {
  using ECDSA for bytes32;
  using PercentageUtils for uint256;

  error InvalidSigner(address expectedSigner, address recoveredSigner);

  constructor(address _registry) UseStore(_registry) {}

  /**
   * @dev Is intended to pull tokens in to a user's proxy (the calling context)
   * @param data Encoded calldata that conforms to the PositionCreatedData struct
   */
  function execute(bytes calldata data, uint8[] memory) external payable override {
    ChargeFeeData memory chargeFeeData = parseInputs(data);

    _verifySignature(chargeFeeData);

    uint256 netWorthInCollateral = _calculateNetWorthInCollateral(chargeFeeData);

    uint256 feeAmount = _calculateFeeAmount(chargeFeeData, netWorthInCollateral);

    _chargeFee(feeAmount);
  }

  /// INTERNALS
  function parseInputs(bytes memory _callData) internal pure returns (ChargeFeeData memory params) {
    return abi.decode(_callData, (ChargeFeeData));
  }

  function _verifySignature(ChargeFeeData memory chargeFeeData) internal view {
    address expectedBackendSigner = registry.getRegisteredService(BACKEND_MSG_SIGNER);
    address recoveredBackendSigner = keccak256(
      abi.encode(
        chargeFeeData.feeAmount,
        chargeFeeData.maxFeePercentage,
        chargeFeeData.collateralAmount,
        chargeFeeData.collateralAsset,
        chargeFeeData.collateralAssetDecimals,
        chargeFeeData.debtAmount,
        chargeFeeData.debtAsset,
        chargeFeeData.debtAssetDecimals
      )
    ).toEthSignedMessageHash().recover(chargeFeeData.signature);

    if (recoveredBackendSigner != expectedBackendSigner) {
      revert InvalidSigner(expectedBackendSigner, recoveredBackendSigner);
    }
  }

  function _calculateNetWorthInCollateral(
    ChargeFeeData memory chargeFeeData
  ) internal view returns (uint256) {
    IOracleAdapter oracleAdapter = IOracleAdapter(registry.getRegisteredService(ORACLE_ADAPTER));

    if (chargeFeeData.debtAmount == 0) {
      return chargeFeeData.collateralAmount;
    }

    // TODO: for now we only support USD denomination
    (int256 latestPriceCollateral, uint8 collateralPriceDecimals) = oracleAdapter.getLatestPrice(
      chargeFeeData.collateralAsset,
      USD
    );
    (int256 latestPriceDebt, uint8 debtPriceDecimals) = oracleAdapter.getLatestPrice(
      chargeFeeData.debtAsset,
      USD
    );

    uint256 debtAmountInCollateral = PriceUtils.convertAmountOnOraclePrice(
      chargeFeeData.debtAmount,
      chargeFeeData.debtAssetDecimals,
      latestPriceDebt,
      debtPriceDecimals,
      chargeFeeData.collateralAssetDecimals,
      latestPriceCollateral,
      collateralPriceDecimals
    );

    return chargeFeeData.collateralAmount - debtAmountInCollateral;
  }

  function _calculateFeeAmount(
    ChargeFeeData memory chargeFeeData,
    uint256 netWorthInCollateral
  ) internal pure returns (uint256) {
    uint256 maxFeeAmount = netWorthInCollateral.applyPercentage(chargeFeeData.maxFeePercentage);
    if (chargeFeeData.feeAmount > maxFeeAmount) {
      return maxFeeAmount;
    }
    return chargeFeeData.feeAmount;
  }

  function _chargeFee(uint256 feeAmount) internal {
    // TODO: charge fee to the user
  }
}
