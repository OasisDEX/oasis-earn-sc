import { parseUnits } from '@ethersproject/units'
import { BigNumber, BigNumberish } from 'ethers'

/**
    @notice Parses an amount and returns the corresponding BigNumber representation with the correct
            number of decimals. If the input parameter is already a BigNumber, it is assumed it is
            already in the right format

    @param amount The amount to parse, as a number, a string or a BigNumber. If it is a
                  BigNumber, it is assumed it is already in the right format
    @param decimals The number of decimals of the amount

    @return The amount as a BigNumber with the correct number of decimals
 */
export function parseAmount(amount: BigNumberish, decimals: BigNumberish = 18): BigNumber {
  if (typeof amount === 'number' || typeof amount === 'string') {
    return parseUnits(String(amount), decimals)
  } else {
    return BigNumber.from(amount)
  }
}

/**
    @notice Converts an input amount into an output amount by applying a price fraction and taking
            into account the number of decimals of the input and output amounts

    @param amount_ The input amount, as a number, a string or a BigNumber. If it is a
                    BigNumber, it is assumed it is already in the right format
    @param outputTokenDecimals_ The number of decimals of the output token
    @param inputTokenDecimals_ The number of decimals of the input token
    @param priceNumerator_ The numerator of the price fraction, as a number, a string or a BigNumber.
                           If it is a BigNumber, it is assumed it is already in the right format
    @param priceDenominator_ The denominator of the price fraction, as a number, a string or a BigNumber.
                             If it is a BigNumber, it is assumed it is already in the right format

    @returns The output amount as a BigNumber with the `outputTokenDecimals` decimals
 */
export function convertAmount(
  amount_: BigNumberish,
  outputTokenDecimals_: BigNumberish,
  inputTokenDecimals_: BigNumberish = 18,
  priceNumerator_: BigNumberish = 1,
  priceDenominator_: BigNumberish = 1,
): BigNumber {
  const inputTokenDecimals = BigNumber.from(inputTokenDecimals_)
  const outputTokenDecimals = BigNumber.from(outputTokenDecimals_)
  const amount = parseAmount(amount_, inputTokenDecimals)
  const priceNumerator = BigNumber.from(priceNumerator_)
  const priceDenominator = BigNumber.from(priceDenominator_)

  if (inputTokenDecimals.eq(outputTokenDecimals)) {
    return amount.mul(priceNumerator).div(priceDenominator)
  } else if (inputTokenDecimals.gt(outputTokenDecimals)) {
    const exponent: BigNumber = inputTokenDecimals.sub(outputTokenDecimals)
    const convertingFactor: BigNumber = BigNumber.from(10).pow(exponent)

    return amount.mul(priceNumerator).div(priceDenominator).div(convertingFactor)
  } else {
    const exponent: BigNumber = outputTokenDecimals.sub(inputTokenDecimals)
    const convertingFactor: BigNumber = BigNumber.from(10).pow(exponent)

    return amount.mul(priceNumerator).mul(convertingFactor).div(priceDenominator)
  }
}
