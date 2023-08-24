import * as AaveCommon from '@dma-library/strategies/aave/common'
import { IOperation } from '@dma-library/types'

import { buildOperationV2 } from './build-operation-v2'
import { buildOperationV3 } from './build-operation-v3'
import { AaveAdjustDependencies, AaveV2AdjustDependencies, BuildOperationArgs } from './types'

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
      network: dependencies.network,
    })
  }

  throw new Error('No operation could be built')
}
