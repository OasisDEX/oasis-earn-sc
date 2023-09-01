import { aaveLike } from '@dma-library/strategies/aave-like'

import { SparkOpen } from './types'

export const open: SparkOpen = async (args, dependencies) => {
  const protocolType = 'Spark' as const
  return await aaveLike.multiply.open(args, { ...dependencies, protocolType })
}
