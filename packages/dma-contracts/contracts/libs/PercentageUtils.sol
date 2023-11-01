// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.15;

/**
    @title PercentageUtils

    @author Roberto Cano <robercano>
    
    @notice Utility library to apply a percentage to an input amount
 */
library PercentageUtils {
  /**
        @notice The number of decimals used for the percentage
     */
  uint256 public constant PERCENTAGE_DECIMALS = 6;

  /**
        @notice The factor used to scale the percentage when applying it
        on an amount
     */
  uint256 public constant PERCENTAGE_FACTOR = 10 ** PERCENTAGE_DECIMALS;

  /**
        @notice Percentage of 100% with the given `PERCENTAGE_DECIMALS`
     */
  uint256 public constant PERCENTAGE_100 = 100 * PERCENTAGE_FACTOR;

  /**
        @notice Adds the percentage to the given amount and returns the result
        
        @return The amount after the percentage is applied

        @dev It performs the following operation:
            (100.0 + percentage) * amount
     */
  function addPercentage(uint256 amount, uint256 percentage) internal pure returns (uint256) {
    return applyPercentage(amount, PERCENTAGE_100 + percentage);
  }

  /**
        @notice Substracts the percentage from the given amount and returns the result
        
        @return The amount after the percentage is applied

        @dev It performs the following operation:
            (100.0 - percentage) * amount
     */
  function subtractPercentage(uint256 amount, uint256 percentage) internal pure returns (uint256) {
    return applyPercentage(amount, PERCENTAGE_100 - percentage);
  }

  /**
        @notice Applies the given percentage to the given amount and returns the result

        @param amount The amount to apply the percentage to
        @param percentage The percentage to apply to the amount

        @return The amount after the percentage is applied
     */
  function applyPercentage(uint256 amount, uint256 percentage) internal pure returns (uint256) {
    return (amount * percentage) / PERCENTAGE_100;
  }

  /**
        @notice Checks if the given percentage is in range, this is, if it is between 0 and 100

        @param percentage The percentage to check

        @return True if the percentage is in range, false otherwise
     */
  function isPercentageInRange(uint256 percentage) internal pure returns (bool) {
    return percentage <= PERCENTAGE_100;
  }

  /**
        @notice Converts the given fraction into a percentage with the right number of decimals

        @param numerator The numerator of the fraction
        @param denominator The denominator of the fraction

        @return The percentage with `PERCENTAGE_DECIMALS` decimals
    */
  function toPercentage(uint256 numerator, uint256 denominator) internal pure returns (uint256) {
    return (numerator * PERCENTAGE_100) / denominator;
  }
}
