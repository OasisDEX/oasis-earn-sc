import { aaveLike } from '@dma-library/strategies/aave-like'
import { SparkDepositBorrowOmni } from '@dma-library/strategies/spark/borrow/deposit-borrow'

export const depositBorrowOmni: SparkDepositBorrowOmni = async (args, dependencies) => {
  const protocolType = 'Spark' as const
  return await aaveLike.omni.borrow.depositBorrow(args, { ...dependencies, protocolType })
}
