import { AaveVersion } from '@dma-library/strategies'
import { isV2, isV3 } from '@dma-library/strategies/aave/adjust/helpers'
import { AaveAdjustArgs, AaveAdjustDependencies } from '@dma-library/strategies/aave/adjust/types'
import { IPosition } from '@domain'

export function getCurrentPosition(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<IPosition | undefined> {
  if (isV2(dependencies)) {
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
  if (isV3(dependencies)) {
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
