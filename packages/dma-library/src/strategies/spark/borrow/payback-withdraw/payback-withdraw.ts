import { aaveLike } from '@dma-library/strategies/aave-like'

import { SparkPaybackWithdraw } from './types'

export const paybackWithdraw: SparkPaybackWithdraw = async (args, dependencies) => {
  const protocolType = 'Spark' as const
  return await aaveLike.borrow.paybackWithdraw(args, { ...dependencies, protocolType })
}
