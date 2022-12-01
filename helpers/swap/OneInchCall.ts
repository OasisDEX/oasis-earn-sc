import BigNumber from 'bignumber.js'

import { one } from '../../scripts/common'
import { swapOneInchTokens } from './1inch'

export const getOneInchCall =
  (swapAddress: string, protocols: string[] = [], debug?: true) =>
  // @param from - The value MUST be in WEI
  // @param to - The value MUST be in WEI
  // @param slippage - The value MUST be a percentage
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    const response = await swapOneInchTokens(
      from,
      to,
      amount.toString(),
      swapAddress,
      slippage.toString(),
      protocols,
    )

    if (debug) {
      console.log('1inch')
      console.log('from:', from)
      console.log('to:', to)
      console.log('fromTokenAmount', response.fromTokenAmount.toString())
      console.log('toTokenAmount', response.toTokenAmount.toString())
``      console.log(`slippage ${slippage.toString()}%`)
    }

    return {
      toTokenAddress: to,
      fromTokenAddress: from,
      minToTokenAmount: new BigNumber(response.toTokenAmount)
        .times(one.minus(slippage.div(new BigNumber(100))))
        .integerValue(BigNumber.ROUND_DOWN),
      toTokenAmount: new BigNumber(response.toTokenAmount),
      fromTokenAmount: new BigNumber(response.fromTokenAmount),
      exchangeCalldata: response.tx.data,
    }
  }
