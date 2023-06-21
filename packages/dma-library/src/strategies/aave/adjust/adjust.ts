import { adjustRiskDown } from '@dma-library/strategies/aave/adjust/adjust-risk-down'
import { adjustRiskUp } from '@dma-library/strategies/aave/adjust/adjust-risk-up'
import { PositionTransition } from '@dma-library/types'
import { isRiskIncreasing } from '@dma-library/utils/swap'

import { AaveAdjustArgs, AaveAdjustDependencies } from './types'

export async function adjust(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<PositionTransition> {
  if (isRiskIncreasing(dependencies.currentPosition.riskRatio, args.multiple)) {
    return adjustRiskUp(args, dependencies)
  } else {
    return adjustRiskDown(args, dependencies)
  }
}
