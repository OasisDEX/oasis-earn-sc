import { aaveLike } from '@dma-library/strategies/aave-like'

import { SparkDepositBorrow } from './types'

export const depositBorrow: SparkDepositBorrow = async (args, dependencies) => {
  const protocolType = 'Spark' as const
  return await aaveLike.borrow.depositBorrow(args, { ...dependencies, protocolType })
}
