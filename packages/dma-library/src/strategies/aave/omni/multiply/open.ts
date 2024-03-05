import * as AaveCommon from '@dma-library/strategies/aave/common'
import {
  AaveOpenDependencies,
  AaveOpenOmni,
  AaveV2OpenDependencies,
} from '@dma-library/strategies/aave/multiply/open/types'
import { aaveLike } from '@dma-library/strategies/aave-like'

export const openOmni: AaveOpenOmni = async (args, dependencies) => {
  if (AaveCommon.isV2<AaveOpenDependencies, AaveV2OpenDependencies>(dependencies)) {
    const protocolType = 'AAVE' as const
    return await aaveLike.omni.multiply.open(args, { ...dependencies, protocolType })
  }

  if (AaveCommon.isV3(dependencies)) {
    const protocolType = 'AAVE_V3' as const
    return await aaveLike.omni.multiply.open(args, { ...dependencies, protocolType })
  }

  throw new Error('Unsupported protocol')
}
