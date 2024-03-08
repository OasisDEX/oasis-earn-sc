import { aaveLike } from '@dma-library/strategies/aave-like'
import { SparkOpenDepositBorrowOmni } from '@dma-library/strategies/spark/borrow/open-deposit-borrow'

export const openDepositBorrowOmni: SparkOpenDepositBorrowOmni = async (args, dependencies) => {
  const protocolType = 'Spark' as const
  return await aaveLike.omni.borrow.openDepositBorrow(args, { ...dependencies, protocolType })
}
