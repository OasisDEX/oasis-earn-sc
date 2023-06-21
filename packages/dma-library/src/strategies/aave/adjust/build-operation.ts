import { buildOperationV2 } from '@dma-library/strategies/aave/adjust/build-operation-v2'
import { buildOperationV3 } from '@dma-library/strategies/aave/adjust/build-operation-v3'
import { isV2, isV3 } from '@dma-library/strategies/aave/adjust/helpers'
import { BuildOperationArgs } from '@dma-library/strategies/aave/adjust/types'
import { IOperation } from '@dma-library/types'

export async function buildOperation({
  adjustRiskUp,
  swapData,
  simulatedPositionTransition,
  collectFeeFrom,
  args,
  dependencies,
}: BuildOperationArgs): Promise<IOperation | undefined> {
  if (isV2(dependencies)) {
    return buildOperationV2({
      adjustRiskUp,
      swapData,
      simulatedPositionTransition,
      collectFeeFrom,
      args,
      dependencies,
      addresses: dependencies.addresses,
      network: dependencies.network,
    })
  }

  if (isV3(dependencies)) {
    return buildOperationV3({
      adjustRiskUp,
      swapData,
      simulatedPositionTransition,
      collectFeeFrom,
      args,
      dependencies,
      addresses: dependencies.addresses,
      network: dependencies.network,
    })
  }

  throw new Error('No operation could be built')
}
