import { adjustRiskDown } from '@dma-library/strategies/aave/adjust/adjust-risk-down'
import { adjustRiskUp } from '@dma-library/strategies/aave/adjust/adjust-risk-up'
import { getFlashloanToken } from '@dma-library/strategies/aave/common'
import { PositionTransition } from '@dma-library/types'
import { isRiskIncreasing } from '@dma-library/utils/swap'

import { AaveAdjustArgs, AaveAdjustDependencies, ExtendedAaveAdjustArgs } from './types'

export async function adjust(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<PositionTransition> {
  const expandedArgs: ExtendedAaveAdjustArgs = {
    ...args,
    flashloanToken: getFlashloanToken(dependencies).flashloanToken,
  }
  if (isRiskIncreasing(dependencies.currentPosition.riskRatio, args.multiple)) {
    return adjustRiskUp(expandedArgs, dependencies)
  } else {
    return adjustRiskDown(expandedArgs, dependencies)
  }
}
