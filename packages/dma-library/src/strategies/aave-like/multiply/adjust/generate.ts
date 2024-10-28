import { amountFromWei } from '@dma-common/utils/common'
import {
  calculateInflatedTokenFee,
  calculatePostSwapFeeAmount,
  calculatePreSwapFeeAmount,
} from '@dma-library/utils/swap'

import { GenerateArgs, IAdjustStrategy } from './types'

export async function generate({
  isIncreasingRisk,
  swapData,
  operation,
  collectFeeFrom,
  fee,
  feeType,
  simulation,
  args,
}: GenerateArgs): Promise<IAdjustStrategy> {
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

  const finalPosition = simulation.position

  // When collecting fees from the target token (collateral here), we want to calculate the fee
  // Based on the toTokenAmount NOT minToTokenAmount so that we overestimate the fee where possible
  // And do not mislead the user
  const sourceTokenAmount = isIncreasingRisk ? simulation.delta.debt : simulation.delta.collateral

  // TODO: extract this to a helper function like on the left side
  const preSwapFee = calculatePreSwapFeeAmount(collectFeeFrom, sourceTokenAmount, fee, feeType)

  const postSwapFee = calculatePostSwapFeeAmount(
    collectFeeFrom,
    swapData.toTokenAmount,
    fee,
    feeType,
  )

  return {
    transaction: {
      calls: operation.calls,
      operationName: operation.operationName,
    },
    simulation: {
      delta: simulation.delta,
      swap: {
        ...simulation.swap,
        ...swapData,
        collectFeeFrom,
        tokenFee: calculateInflatedTokenFee({ postSwapFee, preSwapFee }),
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        expectedMarketPriceWithSlippage,
      ),
    },
    flashloan: {
      amount: simulation.flashloan.amount,
      token: simulation.flashloan.token,
    },
  }
}
