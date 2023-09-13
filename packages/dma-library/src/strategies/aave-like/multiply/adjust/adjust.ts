import { getFlashloanToken } from '@dma-library/strategies/aave/common'
import { isRiskIncreasing } from '@domain/utils/risk-direction'

import { adjustRiskDown } from './adjust-risk-down'
import { adjustRiskUp } from './adjust-risk-up'
import { AaveLikeAdjust, ExtendedAaveLikeAdjustArgs } from './types'

export const adjust: AaveLikeAdjust = async (args, dependencies) => {
  const expandedArgs: ExtendedAaveLikeAdjustArgs = {
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
