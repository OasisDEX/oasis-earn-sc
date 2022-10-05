import BigNumber from 'bignumber.js'

import { testMarketPrice } from '../../test/config'

export const oneInchCallMock =
  (marketPrice: BigNumber = new BigNumber(testMarketPrice)) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    return {
      fromTokenAddress: from,
      toTokenAddress: to,
      fromTokenAmount: amount,
      toTokenAmount: amount.div(marketPrice),
      minToTokenAmount: amount
        .div(marketPrice)
        .times(new BigNumber(1).minus(slippage))
        .integerValue(BigNumber.ROUND_DOWN), // TODO: figure out slippage
      exchangeCalldata: 0,
    }
  }
