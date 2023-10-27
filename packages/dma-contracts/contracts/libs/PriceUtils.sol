// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.15;

import "@prb/math/contracts/PRBMathUD60x18.sol";

/**
    @title PriceUtils

    @author Roberto Cano <robercano>
    
    @notice Utility library to convert an input amount into an output amount using
    the given priceNumerator as the conversion factor
 */
library PriceUtils {
  using PRBMathUD60x18 for uint256;

  uint256 internal constant PRICE_RATE_DECIMALS = 8;

  /**
        @notice Given an amount of input asset it calculates how much amount of the output 
        asset will be received at the given priceNumerator rate

        @param priceRate The priceNumerator rate of as output/input in PRBMathUD60x18 format
        @param inputAmount The amount of input asset to convert, as a uint256

        @return The amount of output asset that will be received
     */
  function toOutputAmount(uint256 priceRate, uint256 inputAmount) internal pure returns (uint256) {
    return priceRate.mul(PRBMathUD60x18.fromUint(inputAmount)).toUint();
  }

  /**
        @notice Given a desired output amount it calculates how much input asset is needed
        at the current priceNumerator rate

        @param priceRate The priceNumerator rate of as input/output in PRBMathUD60x18 format
        @param outputAmount The desired amount of output asset, as a uint256

        @return The amount of input asset that will be received
     */
  function toInputAmount(uint256 priceRate, uint256 outputAmount) internal pure returns (uint256) {
    return PRBMathUD60x18.fromUint(outputAmount).div(priceRate).toUint();
  }

  /**
        @notice Converts an amount of input token to an amount of output token using the given price rate

        @param inputTokenDecimals The number of decimals of the input token
        @param outputTokenDecimals The number of decimals of the output token
        @param amount The amount of the input token to convert
        @param inputTokenPrice Price of the input token
        @param outputTokenPrice Price of the output token

        @return outputAmount The output amount denominated in the output token

        @dev Both prices must be expressed in the same currency, e.g. USD
     */
  function convertAmount(
    uint256 inputTokenDecimals,
    uint256 outputTokenDecimals,
    uint256 amount,
    uint256 inputTokenPrice,
    uint256 outputTokenPrice
  ) internal pure returns (uint256 outputAmount) {
    uint256 priceRate = PRBMathUD60x18.div(
      PRBMathUD60x18.fromUint(inputTokenPrice),
      PRBMathUD60x18.fromUint(outputTokenPrice)
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
