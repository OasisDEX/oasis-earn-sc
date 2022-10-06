import BigNumber from 'bignumber.js'

import { one } from '../../scripts/common'
import { swapOneInchTokens } from './1inch'

export const getOneInchCall =
  (swapAddress: string) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    const response = await swapOneInchTokens(
      from,
      to,
      amount.toString(),
      swapAddress,
      slippage.toString(),
    )

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
