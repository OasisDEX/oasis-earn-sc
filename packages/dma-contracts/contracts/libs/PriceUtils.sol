// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.15;

/**
    @title PriceUtils   
    @notice Utility library to convert an input amount into an output amount using
    the given priceNumerator and priceDenominator as the conversion factor
 */
library PriceUtils {
  /**
        @notice Converts an amount of input token to an amount of output token using the given price rate

        @param inputTokenDecimals The number of decimals of the input token
        @param outputTokenDecimals The number of decimals of the output token
        @param amount The amount of the input token to convert
        @param priceNumerator The numerator of the price rate
        @param priceDenominator The denominator of the price rate

        @return outputAmount The output amount denominated in the output token
     */
  function convertAmount(
    uint8 inputTokenDecimals,
    uint8 outputTokenDecimals,
    uint256 amount,
    int256 priceNumerator,
    uint256 priceDenominator
  ) internal pure returns (uint256 outputAmount) {
    uint256 priceRate = PRBMathUD60x18.div(
      PRBMathUD60x18.fromUint(priceNumerator),
      PRBMathUD60x18.fromUint(priceDenominator)
    );

    if (inputTokenDecimals > outputTokenDecimals) {
      uint256 exp = inputTokenDecimals - outputTokenDecimals;
      priceRate = priceRate.div(PRBMathUD60x18.fromUint(10 ** exp));
    } else if (inputTokenDecimals < outputTokenDecimals) {
      uint256 exp = outputTokenDecimals - inputTokenDecimals;
      priceRate = priceRate.mul(PRBMathUD60x18.fromUint(10 ** exp));
    }

    return priceRate.mul(PRBMathUD60x18.fromUint(amount)).toUint();
  }
}
