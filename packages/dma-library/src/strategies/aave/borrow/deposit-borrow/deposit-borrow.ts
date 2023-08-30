import * as AaveCommon from '@dma-library/strategies/aave/common'
import { aaveLike } from '@dma-library/strategies/aave-like'

import {
  AaveDepositBorrow,
  AaveDepositBorrowDependencies,
  AaveV2DepositBorrowDependencies,
} from './types'

export const depositBorrow: AaveDepositBorrow = async (args, dependencies) => {
  if (
    AaveCommon.isV2<AaveDepositBorrowDependencies, AaveV2DepositBorrowDependencies>(dependencies)
  ) {
    const protocolType = 'AAVE' as const
    return await aaveLike.borrow.depositBorrow(args, { ...dependencies, protocolType })
  }

  if (AaveCommon.isV3(dependencies)) {
    const protocolType = 'AAVE_V3' as const
    return await aaveLike.borrow.depositBorrow(args, { ...dependencies, protocolType })
  }

  throw new Error('Unsupported protocol')
}
