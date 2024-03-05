import { aaveLike } from '@dma-library/strategies/aave-like'
import { SparkCloseOmni } from '@dma-library/strategies/spark/multiply/close'

export const closeOmni: SparkCloseOmni = async (args, dependencies) => {
  const protocolType = 'Spark' as const
  return await aaveLike.omni.multiply.close(args, { ...dependencies, protocolType })
}
