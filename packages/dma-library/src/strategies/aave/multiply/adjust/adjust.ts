import * as AaveCommon from '@dma-library/strategies/aave/common'
import { aaveLike } from '@dma-library/strategies/aave-like'

import { AaveAdjust, AaveAdjustDependencies, AaveV2AdjustDependencies } from './types'

export const adjust: AaveAdjust = async (args, dependencies) => {
  if (AaveCommon.isV2<AaveAdjustDependencies, AaveV2AdjustDependencies>(dependencies)) {
    const protocolType = 'AAVE' as const
    return await aaveLike.multiply.adjust(args, { ...dependencies, protocolType })
  }

  if (AaveCommon.isV3(dependencies)) {
    const protocolType = 'AAVE_V3' as const
    return await aaveLike.multiply.adjust(args, { ...dependencies, protocolType })
  }

  throw new Error('Unsupported protocol')
}
