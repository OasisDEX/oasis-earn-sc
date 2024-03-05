import {
  AaveOpenDepositBorrowDependencies,
  AaveOpenDepositBorrowOmni,
  AaveV2OpenDepositBorrowDependencies,
} from '@dma-library/strategies/aave/borrow/open-deposit-borrow/types'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { aaveLike } from '@dma-library/strategies/aave-like'

export const openDepositBorrowOmni: AaveOpenDepositBorrowOmni = async (args, dependencies) => {
  if (
    AaveCommon.isV2<AaveOpenDepositBorrowDependencies, AaveV2OpenDepositBorrowDependencies>(
      dependencies,
    )
  ) {
    const protocolType = 'AAVE' as const
    return await aaveLike.omni.borrow.openDepositBorrow(args, { ...dependencies, protocolType })
  }

  if (AaveCommon.isV3(dependencies)) {
    const protocolType = 'AAVE_V3' as const
    return await aaveLike.omni.borrow.openDepositBorrow(args, { ...dependencies, protocolType })
  }

  throw new Error('Unsupported protocol')
}
