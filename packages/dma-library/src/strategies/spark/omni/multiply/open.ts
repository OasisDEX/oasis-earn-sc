import { aaveLike } from '@dma-library/strategies/aave-like'
import { SparkOpenOmni } from '@dma-library/strategies/spark/multiply/open'

export const openOmni: SparkOpenOmni = async (args, dependencies) => {
  const protocolType = 'Spark' as const
  return await aaveLike.omni.multiply.open(args, { ...dependencies, protocolType })
}
