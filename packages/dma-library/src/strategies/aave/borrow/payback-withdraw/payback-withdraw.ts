import * as AaveCommon from '@dma-library/strategies/aave/common'
import { aaveLike } from '@dma-library/strategies/aave-like'

import {
  AavePaybackWithdraw,
  AavePaybackWithdrawDependencies,
  AaveV2PaybackWithdrawDependencies,
} from './types'

export const paybackWithdraw: AavePaybackWithdraw = async (args, dependencies) => {
  if (
    AaveCommon.isV2<AavePaybackWithdrawDependencies, AaveV2PaybackWithdrawDependencies>(
      dependencies,
    )
  ) {
    const protocolType = 'AAVE' as const
    return await aaveLike.borrow.paybackWithdraw(args, { ...dependencies, protocolType })
  }

  if (AaveCommon.isV3(dependencies)) {
    const protocolType = 'AAVE_V3' as const
    return await aaveLike.borrow.paybackWithdraw(args, { ...dependencies, protocolType })
  }

  throw new Error('Unsupported protocol')
}
