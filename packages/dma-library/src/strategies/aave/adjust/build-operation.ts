import { buildOperationV2 } from '@dma-library/strategies/aave/adjust/build-operation-v2'
import { buildOperationV3 } from '@dma-library/strategies/aave/adjust/build-operation-v3'
import {
  AaveAdjustDependencies,
  AaveV2AdjustDependencies,
  BuildOperationArgs,
} from '@dma-library/strategies/aave/adjust/types'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { IOperation } from '@dma-library/types'

export async function buildOperation({
  adjustRiskUp,
  swapData,
  simulatedPositionTransition,
  collectFeeFrom,
  args,
  dependencies,
}: BuildOperationArgs): Promise<IOperation | undefined> {
  if (AaveCommon.isV2<AaveAdjustDependencies, AaveV2AdjustDependencies>(dependencies)) {
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

  if (AaveCommon.isV3(dependencies)) {
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
