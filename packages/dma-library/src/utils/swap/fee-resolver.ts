import type { Network } from '@deploy-configurations/types/network'
import { SwapFeeType } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { getEarnMultiplyFee } from '../fee-service/getEarnMultiplyFee'
import { ProtocolId } from '../fee-service/ProtocolId'
import { isCorrelatedPosition } from './isCorrelatedPosition'
import { percentageFeeResolver } from './percentage-fee-resolver'

export const feeResolver = async <T extends string = string>(
  fromToken: T,
  toToken: T,
  options?: {
    isIncreasingRisk?: boolean
    /** @deprecated Should rely on correlated asset matrix  */
    isEarnPosition?: boolean
    isEntrySwap?: boolean
    positionData?: {
      network: Network
      protocolId: ProtocolId
      proxyAddress: string
    }
  },
): Promise<{
  feeType: SwapFeeType
  feeToCharge: BigNumber
}> => {
  if (isCorrelatedPosition(fromToken, toToken) || options?.isEarnPosition) {
    if (options?.positionData === undefined) {
      throw new Error('Position data is required for earn multiply fee calculation')
    }
    return {
      feeType: SwapFeeType.Fixed,
      feeToCharge: new BigNumber(await getEarnMultiplyFee(options.positionData)),
    }
  } else {
    return percentageFeeResolver(fromToken, toToken, options)
  }
}
