// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.15;

/**
    @title PriceUtils   
    @notice Utility library to manage prices and amounts conversion
 */
library PriceUtils {
  /**
        @notice Converts an amount of an input token to an amount of an output token by using their
                respective Chainlink prices and decimals

        @param inputTokenAmount The amount of the input token to convert
        @param inputTokenDecimals The number of decimals of the input token
        @param inputTokenPrice The price of the input token
        @param inputTokenPriceDecimals The number of decimals of the input token price
        @param outputTokenDecimals The number of decimals of the output token
        @param outputTokenPrice The price of the output token
        @param outputTokenPriceDecimals The number of decimals of the output token price

        @return outputAmount The output amount denominated in the output token with the output token decimals

        @dev inputTokenPrice and outputTokenPrice are assumed to be denominated in the same currency
     */
  function convertAmountOnOraclePrice(
    uint256 inputTokenAmount,
    uint8 inputTokenDecimals,
    int256 inputTokenPrice,
    uint8 inputTokenPriceDecimals,
    uint8 outputTokenDecimals,
    int256 outputTokenPrice,
    uint8 outputTokenPriceDecimals
  ) internal pure returns (uint256 outputAmount) {
    uint8 inputDecimals = inputTokenDecimals + inputTokenPriceDecimals;
    uint8 outputDecimals = outputTokenDecimals + outputTokenPriceDecimals;

    if (inputDecimals > outputDecimals) {
      uint256 exp = inputDecimals - outputDecimals;
      return
        (inputTokenAmount * uint256(inputTokenPrice)) / (10 ** exp) / uint256(outputTokenPrice);
    } else if (inputTokenDecimals < outputTokenDecimals) {
      uint256 exp = outputDecimals - inputDecimals;
      return
        (inputTokenAmount * uint256(inputTokenPrice) * (10 ** exp)) / uint256(outputTokenPrice);
    }
  }
}
