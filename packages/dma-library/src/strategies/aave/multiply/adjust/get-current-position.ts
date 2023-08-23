import * as AaveCommon from '@dma-library/strategies/aave/common'
import { AaveVersion } from '@dma-library/types/aave'
import { IPosition } from '@domain'

import { AaveAdjustArgs, AaveAdjustDependencies, AaveV2AdjustDependencies } from './types'

export function getCurrentPosition(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<IPosition | undefined> {
  if (AaveCommon.isV2<AaveAdjustDependencies, AaveV2AdjustDependencies>(dependencies)) {
    return dependencies.protocol.getCurrentPosition(
      {
        collateralToken: args.collateralToken,
        debtToken: args.debtToken,
        proxy: dependencies.proxy,
      },
      {
        addresses: dependencies.addresses,
        provider: dependencies.provider,
        protocolVersion: AaveVersion.v2,
      },
    )
  }
  if (AaveCommon.isV3(dependencies)) {
    return dependencies.protocol.getCurrentPosition(
      {
        collateralToken: args.collateralToken,
        debtToken: args.debtToken,
        proxy: dependencies.proxy,
      },
      {
        addresses: dependencies.addresses,
        provider: dependencies.provider,
        protocolVersion: dependencies.protocol.version,
      },
    )
  }

  throw new Error('No position found')
}
