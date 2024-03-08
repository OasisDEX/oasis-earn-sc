import {
  AaveDepositBorrowDependencies,
  AaveDepositBorrowOmni,
  AaveV2DepositBorrowDependencies,
} from '@dma-library/strategies/aave/borrow/deposit-borrow/types'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { aaveLike } from '@dma-library/strategies/aave-like'

export const depositBorrowOmni: AaveDepositBorrowOmni = async (args, dependencies) => {
  if (
    AaveCommon.isV2<AaveDepositBorrowDependencies, AaveV2DepositBorrowDependencies>(dependencies)
  ) {
    const protocolType = 'AAVE' as const
    return await aaveLike.omni.borrow.depositBorrow(args, { ...dependencies, protocolType })
  }

  if (AaveCommon.isV3(dependencies)) {
    const protocolType = 'AAVE_V3' as const
    return await aaveLike.omni.borrow.depositBorrow(args, { ...dependencies, protocolType })
  }

  throw new Error('Unsupported protocol')
}
