import BigNumber from 'bignumber.js'

import { one } from '../../scripts/common'
import { swapOneInchTokens } from './1inch'

export const getOneInchCall =
  (swapAddress: string, debug?: true) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    const slippageAsPercentage = slippage.times(100).toString()
    const response = await swapOneInchTokens(
      from,
      to,
      amount.toString(),
      swapAddress,
      slippageAsPercentage.toString(),
    )

    if (debug) {
      console.log('1inch')
      console.log('fromTokenAmount', response.fromTokenAmount.toString())
      console.log('toTokenAmount', response.toTokenAmount.toString())
      console.log('slippage %', slippageAsPercentage.toString())
    }

    return {
      toTokenAddress: to,
      fromTokenAddress: from,
      minToTokenAmount: new BigNumber(response.toTokenAmount)
        .times(one.minus(slippage))
        .integerValue(BigNumber.ROUND_DOWN),
      toTokenAmount: new BigNumber(response.toTokenAmount),
      fromTokenAmount: new BigNumber(response.fromTokenAmount),
      exchangeCalldata: response.tx.data,
    }
  }
