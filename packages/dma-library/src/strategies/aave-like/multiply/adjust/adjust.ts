import { TYPICAL_PRECISION } from '@dma-common/constants'
import {
  getAaveTokenAddress as getAaveTokenAddressBySymbol,
  getFlashloanToken,
} from '@dma-library/strategies/aave/common'
import { isRiskIncreasing } from '@domain/utils/risk-direction'

import { adjustRiskDown } from './adjust-risk-down'
import { adjustRiskUp } from './adjust-risk-up'
import { AaveLikeAdjust, ExtendedAaveLikeAdjustArgs } from './types'

export const adjust: AaveLikeAdjust = async (args, dependencies) => {
  const debtTokenAddress = getAaveTokenAddressBySymbol(args.debtToken, dependencies.addresses)

  const resolvedFlashloanToken =
    args.flashloan ??
    getFlashloanToken({
      ...dependencies,
      protocol: dependencies.protocolType,
      debt: {
        symbol: args.debtToken.symbol,
        address: debtTokenAddress,
        precision: args.debtToken.precision ?? TYPICAL_PRECISION,
      },
    }).flashloan

  const expandedArgs: ExtendedAaveLikeAdjustArgs = {
    ...args,
    flashloan: resolvedFlashloanToken,
  }

  const riskIncreasing = isRiskIncreasing(
    args.multiple.loanToValue,
    dependencies.currentPosition.riskRatio.loanToValue,
  )

  return riskIncreasing
    ? adjustRiskUp(expandedArgs, dependencies)
    : adjustRiskDown(expandedArgs, dependencies)
}
