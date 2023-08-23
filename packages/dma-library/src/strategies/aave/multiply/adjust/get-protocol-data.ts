import { AaveProtocolData } from '@dma-library/protocols'
import * as AaveCommon from '@dma-library/strategies/aave/common'

import { AaveAdjustArgs, AaveAdjustDependencies, AaveV2AdjustDependencies } from './types'

export async function getProtocolData(
  collateralTokenAddress: string,
  debtTokenAddress: string,
  args: AaveAdjustArgs,
  flashloanTokenAddress: string,
  dependencies: AaveAdjustDependencies,
): AaveProtocolData {
  if (AaveCommon.isV2<AaveAdjustDependencies, AaveV2AdjustDependencies>(dependencies)) {
    return dependencies.protocol.getProtocolData({
      flashloanTokenAddress,
      collateralTokenAddress,
      debtTokenAddress,
      addresses: dependencies.addresses,
      provider: dependencies.provider,
      protocolVersion: dependencies.protocol.version,
    })
  }
  if (AaveCommon.isV3(dependencies)) {
    return await dependencies.protocol.getProtocolData({
      flashloanTokenAddress,
      collateralTokenAddress,
      debtTokenAddress,
      addresses: dependencies.addresses,
      provider: dependencies.provider,
      protocolVersion: dependencies.protocol.version,
    })
  }

  throw new Error('No protocol data could be found')
}
