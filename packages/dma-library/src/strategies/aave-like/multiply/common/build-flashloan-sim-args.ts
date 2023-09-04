import { FEE_BASE } from '@dma-common/constants'
import * as StrategyParams from '@dma-library/types/strategy-params'
import BigNumber from 'bignumber.js'

/**
 * TODO: Remove the need for this function
 * Flashloan calculations should not be part of the adjustToTargetRiskRatio logic
 */
export function buildFlashloanSimArgs(
  flashloanTokenAddress: string,
  dependencies: Omit<StrategyParams.WithAaveLikeMultiplyStrategyDependencies, 'currentPosition'>,
  reserveDataForFlashloan: any,
) {
  const lendingProtocol = dependencies.protocolType
  if (lendingProtocol === 'AAVE' || lendingProtocol === 'AAVE_V3') {
    const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(FEE_BASE)

    return {
      maxLoanToValueFL: maxLoanToValueForFL,
      tokenSymbol: flashloanTokenAddress === dependencies.addresses.tokens.DAI ? 'DAI' : 'USDC',
    }
  }
}
