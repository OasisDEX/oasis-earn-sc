import BigNumber from 'bignumber.js'

import { amountFromWei, amountToWei } from '../common'

const testMarketPrice = 0.979
export const oneInchCallMock =
  (
    marketPrice: BigNumber = new BigNumber(testMarketPrice),
    precision: { from: number; to: number } = { from: 18, to: 18 },
    debug = false,
  ) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    // EG FROM WBTC 8 to USDC 6
    // Convert WBTC fromWei
    // Apply market price
    // Convert result back to USDC at precision 6
    const precisionAdjustedToAmount = amountToWei(
      amountFromWei(amount, precision.from).div(marketPrice),
      precision.to,
    ).integerValue(BigNumber.ROUND_DOWN)

    if (debug) {
      console.log('OneInchCallMock')
      console.log('Amount to swap:', amount.toString())
      console.log('Market price:', marketPrice.toString())
      console.log('Precision from:', precision.from)
      console.log('Precision to:', precision.to)
      console.log('Received amount:', precisionAdjustedToAmount.toString())
    }

    return {
      fromTokenAddress: from,
      toTokenAddress: to,
      fromTokenAmount: amount,
      toTokenAmount: precisionAdjustedToAmount,
      minToTokenAmount: precisionAdjustedToAmount
        .times(new BigNumber(1).minus(slippage))
        .integerValue(BigNumber.ROUND_DOWN), // TODO: figure out slippage
      exchangeCalldata: 0,
    }
  }
