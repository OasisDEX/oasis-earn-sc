import { BigNumber } from 'ethers'

export function convertAmount(
  inputTokenDecimals: number,
  outputTokenDecimals: number,
  inputAmount: BigNumber,
  priceNumerator: BigNumber,
  priceDenominator: BigNumber,
) {
  if (inputTokenDecimals > outputTokenDecimals) {
    const exp = inputTokenDecimals - outputTokenDecimals
    const factor = BigNumber.from(10).pow(exp)

    return inputAmount.mul(priceNumerator).div(priceDenominator).div(factor)
  } else {
    const exp = outputTokenDecimals - inputTokenDecimals
    const factor = BigNumber.from(10).pow(exp)

    return inputAmount.mul(priceNumerator).mul(factor).div(priceDenominator).div(factor)
  }
}
