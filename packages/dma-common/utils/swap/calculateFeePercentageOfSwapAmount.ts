import type BigNumber from 'bignumber.js'

import { FEE_BASE, SwapFeeType } from '../../constants'

/**
 * Calculate the fee percentage of the swap amount based on the fee type
 */
export const calculateFeePercentageOfSwapAmount = ({
  collectFeeFromSourceToken,
  oazoFee,
  feeType,
  collateral,
  debt,
}: {
  collectFeeFromSourceToken: boolean
  oazoFee: BigNumber
  feeType: SwapFeeType
  collateral: BigNumber
  debt: BigNumber
}) => {
  let feeInPercentage: BigNumber
  if (feeType === SwapFeeType.Percentage) {
    // e.g. default fee = 2/10000 = 0.02%
    feeInPercentage = oazoFee.div(FEE_BASE)
  } else {
    if (collectFeeFromSourceToken) {
      // 0.005942561619834259 WETH / 59.25820476811249 WETH = 0.01%
      feeInPercentage = oazoFee.div(collateral).times(100)
    } else {
      feeInPercentage = oazoFee.div(debt).times(100)
    }
  }
  return feeInPercentage
}
