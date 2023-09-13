import * as AaveCommon from '@dma-library/strategies/aave/common'
import { aaveLike } from '@dma-library/strategies/aave-like'

import { AaveOpen, AaveOpenDependencies, AaveV2OpenDependencies } from './types'

export const open: AaveOpen = async (args, dependencies) => {
  if (AaveCommon.isV2<AaveOpenDependencies, AaveV2OpenDependencies>(dependencies)) {
    const protocolType = 'AAVE' as const
    return await aaveLike.multiply.open(args, { ...dependencies, protocolType })
  }

  if (AaveCommon.isV3(dependencies)) {
    const protocolType = 'AAVE_V3' as const
    return await aaveLike.multiply.open(args, { ...dependencies, protocolType })
  }

  throw new Error('Unsupported protocol')
}
