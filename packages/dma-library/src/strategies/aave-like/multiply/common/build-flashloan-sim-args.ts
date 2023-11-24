import { FEE_BASE, ONE, ZERO } from '@dma-common/constants'
import * as StrategyParams from '@dma-library/types/strategy-params'
import { WithFlashLoanArgs } from '@dma-library/types/strategy-params'
import { isAaveLikeProtocol } from '@dma-library/utils/aave-like'
import { IPositionTransitionParams } from '@domain'
import BigNumber from 'bignumber.js'

/**
 * TODO: Remove the need for this function
 * Flashloan calculations should not be part of the adjustToTargetRiskRatio logic
 */
export function buildFlashloanSimArgs(
  flashloan: WithFlashLoanArgs['flashloan'],
  dependencies: Omit<StrategyParams.WithAaveLikeMultiplyStrategyDependencies, 'currentPosition'>,
  reserveDataForFlashloan: { ltv: BigNumber },
): IPositionTransitionParams['flashloan'] | undefined {
  const lendingProtocol = dependencies.protocolType
  if (isAaveLikeProtocol(lendingProtocol)) {
    const ltv = new BigNumber(reserveDataForFlashloan.ltv.toString())
    const fallbackMaxLTV = ONE
    const maxLoanToValueForFL = ltv.eq(ZERO)
      ? fallbackMaxLTV
      : new BigNumber(reserveDataForFlashloan.ltv.toString()).div(FEE_BASE)

    return {
      maxLoanToValueFL: maxLoanToValueForFL,
      token: {
        symbol: flashloan.token.symbol,
        precision: flashloan.token.precision,
      },
    }
  }
  return undefined
}
