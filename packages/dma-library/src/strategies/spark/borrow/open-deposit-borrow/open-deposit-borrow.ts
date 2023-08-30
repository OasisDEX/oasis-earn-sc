import { aaveLike } from '@dma-library/strategies/aave-like'

import { SparkOpenDepositBorrow } from './types'

export const openDepositBorrow: SparkOpenDepositBorrow = async (args, dependencies) => {
  const protocolType = 'Spark' as const
  return await aaveLike.borrow.openDepositBorrow(args, { ...dependencies, protocolType })
}
