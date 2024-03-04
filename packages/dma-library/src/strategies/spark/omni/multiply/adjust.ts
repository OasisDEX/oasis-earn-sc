import { aaveLike } from '@dma-library/strategies/aave-like'
import { SparkAdjustOmni } from '@dma-library/strategies/spark/multiply/adjust'

export const adjustOmni: SparkAdjustOmni = async (args, dependencies) => {
  const protocolType = 'Spark' as const
  return await aaveLike.omni.multiply.adjust(args, { ...dependencies, protocolType })
}
