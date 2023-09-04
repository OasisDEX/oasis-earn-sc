import * as AaveCommon from '@dma-library/strategies/aave/common'
import {
  AaveClose,
  AaveCloseDependencies,
  AaveV2CloseDependencies,
} from '@dma-library/strategies/aave/multiply/close/types'
import { aaveLike } from '@dma-library/strategies/aave-like'

export const close: AaveClose = async (args, dependencies) => {
  if (AaveCommon.isV2<AaveCloseDependencies, AaveV2CloseDependencies>(dependencies)) {
    const protocolType = 'AAVE' as const
    return await aaveLike.multiply.close(args, { ...dependencies, protocolType })
  }

  if (AaveCommon.isV3(dependencies)) {
    const protocolType = 'AAVE_V3' as const
    return await aaveLike.multiply.close(args, { ...dependencies, protocolType })
  }

  throw new Error('Unsupported protocol')
}
