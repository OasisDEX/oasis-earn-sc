import { AaveProtocolData } from '@dma-library/protocols'
import { isV2, isV3 } from '@dma-library/strategies/aave/adjust/helpers'
import { AaveAdjustArgs, AaveAdjustDependencies } from '@dma-library/strategies/aave/adjust/types'

export async function getProtocolData(
  collateralTokenAddress: string,
  debtTokenAddress: string,
  args: AaveAdjustArgs,
  flashloanTokenAddress: string,
  dependencies: AaveAdjustDependencies,
): AaveProtocolData {
  if (isV2(dependencies)) {
    return dependencies.protocol.getProtocolData({
      flashloanTokenAddress,
      collateralTokenAddress,
      debtTokenAddress,
      addresses: dependencies.addresses,
      provider: dependencies.provider,
      protocolVersion: dependencies.protocol.version,
    })
  }
  if (isV3(dependencies)) {
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
