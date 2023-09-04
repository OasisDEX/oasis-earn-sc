import { aaveLike } from '@dma-library/strategies/aave-like'

import { SparkAdjust } from './types'

export const adjust: SparkAdjust = async (args, dependencies) => {
  const protocolType = 'Spark' as const
  return await aaveLike.multiply.adjust(args, { ...dependencies, protocolType })
}
