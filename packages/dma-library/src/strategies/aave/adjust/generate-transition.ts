import { FEE_ESTIMATE_INFLATOR, ONE, ZERO } from '@dma-common/constants'
import { amountFromWei } from '@dma-common/utils/common'
import { calculateFee } from '@dma-common/utils/swap'
import { GenerateTransitionArgs } from '@dma-library/strategies/aave/adjust/types'
import { PositionTransition } from '@dma-library/types'
import BigNumber from 'bignumber.js'

export async function generateTransition({
  isIncreasingRisk,
  swapData,
  operation,
  collectFeeFrom,
  fee,
  simulatedPositionTransition,
  args,
}: GenerateTransitionArgs): Promise<PositionTransition> {
  const fromTokenPrecision = isIncreasingRisk
    ? args.debtToken.precision
    : args.collateralToken.precision
  const toTokenPrecision = isIncreasingRisk
    ? args.collateralToken.precision
    : args.debtToken.precision

  const fromTokenAmountNormalised = amountFromWei(swapData.fromTokenAmount, fromTokenPrecision)
  const toTokenAmountNormalisedWithMaxSlippage = amountFromWei(
    swapData.minToTokenAmount,
    toTokenPrecision,
  )

  const expectedMarketPriceWithSlippage = fromTokenAmountNormalised.div(
    toTokenAmountNormalisedWithMaxSlippage,
  )

  const finalPosition = simulatedPositionTransition.position

  // When collecting fees from the target token (collateral here), we want to calculate the fee
  // Based on the toTokenAmount NOT minToTokenAmount so that we overestimate the fee where possible
  // And do not mislead the user
  const shouldCollectFeeFromSourceToken = collectFeeFrom === 'sourceToken'
  const sourceTokenAmount = isIncreasingRisk
    ? simulatedPositionTransition.delta.debt
    : simulatedPositionTransition.delta.collateral

  const preSwapFee = shouldCollectFeeFromSourceToken
    ? calculateFee(sourceTokenAmount, fee.toNumber())
    : ZERO
  const postSwapFee = shouldCollectFeeFromSourceToken
    ? ZERO
    : calculateFee(swapData.toTokenAmount, fee.toNumber())

  return {
    transaction: {
      calls: operation.calls,
      operationName: operation.operationName,
    },
    simulation: {
      delta: simulatedPositionTransition.delta,
      flags: simulatedPositionTransition.flags,
      swap: {
        ...simulatedPositionTransition.swap,
        ...swapData,
        collectFeeFrom,
        tokenFee: preSwapFee.plus(
          postSwapFee.times(ONE.plus(FEE_ESTIMATE_INFLATOR)).integerValue(BigNumber.ROUND_DOWN),
        ),
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        expectedMarketPriceWithSlippage,
      ),
    },
  }
}
