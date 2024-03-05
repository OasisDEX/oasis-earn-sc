import { aaveLike } from '@dma-library/strategies/aave-like'
import { SparkPaybackWithdrawOmni } from '@dma-library/strategies/spark/borrow/payback-withdraw'

export const paybackWithdrawOmni: SparkPaybackWithdrawOmni = async (args, dependencies) => {
  const protocolType = 'Spark' as const
  return await aaveLike.omni.borrow.paybackWithdraw(args, { ...dependencies, protocolType })
}
