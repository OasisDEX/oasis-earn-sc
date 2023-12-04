import type { BigNumberish } from '@ethersproject/bignumber'
import { BigNumber } from '@ethersproject/bignumber'

/**
     @title PercentageUtils

     @notice Helper library to handle percentages in the same format as the Solidity files
  */

/**
    @notice The number of decimals used for the slippage percentage
*/
export const PERCENTAGE_DECIMALS = 6

/**
    @notice The factor used to scale the slippage percentage when calculating the slippage
            on an amount
*/
export const PERCENTAGE_FACTOR = 10 ** PERCENTAGE_DECIMALS

/**
    @notice Percentage of 100% with the given `PERCENTAGE_DECIMALS`
*/
export const PERCENTAGE_100_BN = toSolidityPercentage(100.0)

/**
     @notice Adds the percentage to the given amount and returns the result

    @return The amount after the percentage is applied

    @dev It performs the following operation:
        (100.0 + percentage) * amount / 100.0
*/
export function addPercentage(amount: BigNumber, percentage: BigNumber): BigNumber {
  return applyPercentage(amount, PERCENTAGE_100_BN.add(percentage))
}

/**
     @notice Substracts the percentage from the given amount and returns the result

    @return The amount after the percentage is applied

    @dev It performs the following operation:
        (100.0 - percentage) * amount / 100.0
*/
export function subtractPercentage(amount: BigNumber, percentage: BigNumber): BigNumber {
  return applyPercentage(amount, PERCENTAGE_100_BN.sub(percentage))
}

/**
    @notice Applies the given percentage to the given amount and returns the result

    @param amount The amount to apply the percentage to
    @param percentage The percentage to apply to the amount

    @return The amount after the percentage is applied
*/
export function applyPercentage(amount: BigNumber, percentage: BigNumber): BigNumber {
  return amount.mul(percentage).div(PERCENTAGE_100_BN)
}

/**
    @notice Divides the given amount by the given percentage and returns the result

    @param amount The amount to apply the percentage to
    @param percentage The percentage to divide the amount by

    @return The amount after it is divided by the percentage
*/
export function divByPercentage(amount: BigNumber, percentage: BigNumber): BigNumber {
  return amount.mul(PERCENTAGE_100_BN).div(percentage)
}

/**
    @notice Checks if the given percentage is in range, this is, if it is between 0 and 100

    @param percentage The percentage to check

    @return True if the percentage is in range, false otherwise
*/
export function isPercentageInRange(percentage: number | BigNumber): boolean {
  if (typeof percentage === 'number') {
    return percentage >= 0 && percentage <= 100
  } else {
    return percentage.lte(PERCENTAGE_100_BN)
  }
}

/**
    @notice Transforms the given floating point percentage to the format used by the Solidity files
*/
export function toSolidityPercentage(percentage: number): BigNumber {
  return BigNumber.from(Math.floor(percentage * PERCENTAGE_FACTOR))
}

/**
    @notice Transforms a percentage in the format used by the Solidity files to a floating point percentage
*/
export function fromSolidityPercentage(percentage: BigNumber): number {
  return percentage.div(PERCENTAGE_FACTOR).toNumber()
}

/**
   @notice returns a percentage from a numerator and a denominator that have the same
           denomination
*/
export function fromFraction(numerator: BigNumberish, denominator: BigNumberish): BigNumber {
  return BigNumber.from(numerator).mul(PERCENTAGE_100_BN).div(denominator)
}
