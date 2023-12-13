// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

import { IOracle } from "../interfaces/IOracle.sol";

// Chainlink Aggregator
interface IAggregator {
  function latestAnswer() external view returns (int256);

  function decimals() external view returns (uint8);
}

contract ChainlinkOracleWrapper is IOracle {
  uint8 constant MorphoPriceDecimals = 36;
  uint256 outputPriceScalingFactor = 10 ** MorphoPriceDecimals;

  IAggregator public loanTokenAggregator;
  IAggregator public debtTokenAggregator;

  uint256 public aggregatorScalingNumerator;
  uint256 public aggregatorScalingDenominator;

  constructor(address loanTokenAggregator_, address debtTokenAggregator_) {
    loanTokenAggregator = IAggregator(loanTokenAggregator_);
    debtTokenAggregator = IAggregator(debtTokenAggregator_);

    uint8 loanTokenDecimals = loanTokenAggregator.decimals();
    uint8 debtTokenDecimals = debtTokenAggregator.decimals();

    (aggregatorScalingNumerator, aggregatorScalingDenominator) = getScalingValues(
      loanTokenDecimals,
      debtTokenDecimals
    );
  }

  function price() external view returns (uint256) {
    int256 loanTokenPrice = loanTokenAggregator.latestAnswer();
    int256 debtTokenPrice = debtTokenAggregator.latestAnswer();

    return calculateOutputPrice(uint256(loanTokenPrice), uint256(debtTokenPrice));
  }

  function getScalingValues(
    uint8 numeratorDecimals,
    uint8 denominatorDecimals
  ) private pure returns (uint256 scalingNumerator, uint256 scalingDenominator) {
    if (numeratorDecimals < denominatorDecimals) {
      scalingNumerator = 10 ** (denominatorDecimals - numeratorDecimals);
      scalingDenominator = 1;
    } else {
      scalingNumerator = 1;
      scalingDenominator = 10 ** (numeratorDecimals - denominatorDecimals);
    }
  }

  function calculateOutputPrice(
    uint256 loanTokenPrice,
    uint256 debtTokenPrice
  ) private view returns (uint256) {
    return
      (loanTokenPrice * aggregatorScalingNumerator * outputPriceScalingFactor) /
      debtTokenPrice /
      aggregatorScalingDenominator;
  }
}
