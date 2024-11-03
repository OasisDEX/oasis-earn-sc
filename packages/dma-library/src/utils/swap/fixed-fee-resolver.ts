import type { Network } from '@deploy-configurations/types/network'
import { SwapFeeType } from '@dma-library/types'
import BigNumber from 'bignumber.js'

import { getEarnMultiplyFee } from '../fee-service/getEarnMultiplyFee'
import type { ProtocolId } from '../fee-service/ProtocolId'

export const fixedFeeResolver = async (positionData?: {
  network: Network
  protocolId: ProtocolId
  proxyAddress: string
}): Promise<{
  feeType: SwapFeeType
  feeToCharge: BigNumber
}> => {
  if (positionData === undefined) {
    throw new Error('Position data is required for earn multiply fee calculation')
  }
  return {
    feeType: SwapFeeType.Fixed,
    feeToCharge: new BigNumber(await getEarnMultiplyFee(positionData)),
  }
}
