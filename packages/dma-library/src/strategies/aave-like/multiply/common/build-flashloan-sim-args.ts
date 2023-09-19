import { FEE_BASE } from '@dma-common/constants'
import * as StrategyParams from '@dma-library/types/strategy-params'
import { WithFlashLoanArgs } from '@dma-library/types/strategy-params'
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
  if (lendingProtocol === 'AAVE' || lendingProtocol === 'AAVE_V3') {
    const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(FEE_BASE)

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
