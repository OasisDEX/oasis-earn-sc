import * as AaveCommon from '@dma-library/strategies/aave/common'
import {
  AaveAdjustDependencies,
  AaveAdjustOmni,
  AaveV2AdjustDependencies,
} from '@dma-library/strategies/aave/multiply/adjust/types'
import { aaveLike } from '@dma-library/strategies/aave-like'

export const adjustOmni: AaveAdjustOmni = async (args, dependencies) => {
  if (AaveCommon.isV2<AaveAdjustDependencies, AaveV2AdjustDependencies>(dependencies)) {
    const protocolType = 'AAVE' as const
    return await aaveLike.omni.multiply.adjust(args, { ...dependencies, protocolType })
  }

  if (AaveCommon.isV3(dependencies)) {
    const protocolType = 'AAVE_V3' as const
    return await aaveLike.omni.multiply.adjust(args, { ...dependencies, protocolType })
  }

  throw new Error('Unsupported protocol')
}
