import {
  AavePaybackWithdrawDependencies,
  AavePaybackWithdrawOmni,
  AaveV2PaybackWithdrawDependencies,
} from '@dma-library/strategies/aave/borrow/payback-withdraw/types'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { aaveLike } from '@dma-library/strategies/aave-like'

export const paybackWithdrawOmni: AavePaybackWithdrawOmni = async (args, dependencies) => {
  if (
    AaveCommon.isV2<AavePaybackWithdrawDependencies, AaveV2PaybackWithdrawDependencies>(
      dependencies,
    )
  ) {
    const protocolType = 'AAVE' as const
    return await aaveLike.omni.borrow.paybackWithdraw(args, { ...dependencies, protocolType })
  }

  if (AaveCommon.isV3(dependencies)) {
    const protocolType = 'AAVE_V3' as const
    return await aaveLike.omni.borrow.paybackWithdraw(args, { ...dependencies, protocolType })
  }

  throw new Error('Unsupported protocol')
}
