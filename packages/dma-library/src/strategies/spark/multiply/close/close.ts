import { aaveLike } from '@dma-library/strategies/aave-like'
import { SparkClose } from '@dma-library/strategies/spark/multiply/close/types'

export const close: SparkClose = async (args, dependencies) => {
  const protocolType = 'Spark' as const
  return await aaveLike.multiply.close(args, { ...dependencies, protocolType })
}
