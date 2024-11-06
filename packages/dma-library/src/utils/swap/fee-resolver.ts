import type { Network } from '@deploy-configurations/types/network'
import { SwapFeeType } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { ProtocolId } from '../fee-service/ProtocolId'
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
    positionData?: {
      network: Network
      protocolId: ProtocolId
      proxyAddress: string
    }
  },
): Promise<ResolvedFee> => {
  if (isCorrelatedPosition(fromToken, toToken) || options?.isEarnPosition) {
    return fixedFeeResolver(options?.positionData, options?.isOpeningPosition)
  } else {
    return percentageFeeResolver(fromToken, toToken, options)
  }
}
