import { SwapFeeType } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import type { FixedFeePositionData } from '../fee-service/getFixedFeeForPosition'
import { fixedFeeResolver } from './fixed-fee-resolver'
import { isCorrelatedPosition } from './isCorrelatedPosition'
import { percentageFeeResolver } from './percentage-fee-resolver'

export type ResolvedFee = {
  feeType: SwapFeeType
  feeToCharge: BigNumber
}

export const feeResolver = async <T extends string = string>(
  fromToken: T,
  toToken: T,
  options?: {
    isIncreasingRisk?: boolean
    /** @deprecated Should rely on correlated asset matrix  */
    isEarnPosition?: boolean
    isEntrySwap?: boolean
    isOpeningPosition?: boolean
    positionData?: FixedFeePositionData
  },
): Promise<ResolvedFee> => {
  if (isCorrelatedPosition(fromToken, toToken) || options?.isEarnPosition) {
    return fixedFeeResolver(
      options?.positionData,
      options?.isOpeningPosition,
      options?.isIncreasingRisk,
    )
  } else {
    return percentageFeeResolver(fromToken, toToken, options)
  }
}
