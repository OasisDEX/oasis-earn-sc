import { getFlashloanToken } from '@dma-library/strategies/aave/common'
import { PositionTransition } from '@dma-library/types'
import { isRiskIncreasing } from '@domain/utils/risk-direction'

import { adjustRiskDown } from './adjust-risk-down'
import { adjustRiskUp } from './adjust-risk-up'
import { AaveAdjustArgs, AaveAdjustDependencies, ExtendedAaveAdjustArgs } from './types'

export async function adjust(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<PositionTransition> {
  const expandedArgs: ExtendedAaveAdjustArgs = {
    ...args,
    flashloanToken: getFlashloanToken(dependencies).flashloanToken,
  }
  if (
    isRiskIncreasing(args.multiple.loanToValue, dependencies.currentPosition.riskRatio.loanToValue)
  ) {
    return adjustRiskUp(expandedArgs, dependencies)
  } else {
    return adjustRiskDown(expandedArgs, dependencies)
  }
}
