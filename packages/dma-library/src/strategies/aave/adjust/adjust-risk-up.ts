import { amountToWei } from '@dma-common/utils/common'
import { getAaveTokenAddress } from '@dma-library/strategies'
import { buildOperation } from '@dma-library/strategies/aave/adjust/build-operation'
import { generateTransition } from '@dma-library/strategies/aave/adjust/generate-transition'
import { simulatePositionTransition } from '@dma-library/strategies/aave/adjust/simulate-position-transition'
import { AaveAdjustArgs, AaveAdjustDependencies } from '@dma-library/strategies/aave/adjust/types'
import { AAVETokens, PositionTransition } from '@dma-library/types'
import { feeResolver, getSwapDataHelper } from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

export async function adjustRiskUp(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<PositionTransition> {
  const isAdjustUp = true
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: isAdjustUp,
    isEarnPosition: args.positionType === 'Earn',
  })

  // Get quote swap
  const estimatedSwapAmount = amountToWei(new BigNumber(1), args.debtToken.precision)
  const { swapData: quoteSwapData } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    args: {
      fromToken: args.debtToken,
      toToken: args.collateralToken,
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees: estimatedSwapAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddress: getAaveTokenAddress,
    },
  })

  // SimulateAdjustUp
  const { simulatedPositionTransition: simulatedAdjustUp } = await simulatePositionTransition(
    isAdjustUp,
    quoteSwapData,
    { ...args, fee },
    dependencies,
    true,
    dependencies.debug,
  )

  // Get accurate swap
  const { swapData, collectFeeFrom } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    args: {
      fromToken: args.debtToken,
      toToken: args.collateralToken,
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees: simulatedAdjustUp.swap.fromTokenAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddress: getAaveTokenAddress,
    },
  })

  // buildOperation
  const operation = await buildOperation({
    adjustRiskUp: isAdjustUp,
    swapData,
    simulatedPositionTransition: simulatedAdjustUp,
    collectFeeFrom,
    args,
    dependencies,
    network: dependencies.network,
  })

  if (operation === undefined) throw new Error('No operation built. Check your arguments.')

  // generateTransition
  return await generateTransition({
    isIncreasingRisk: isAdjustUp,
    swapData,
    operation,
    collectFeeFrom,
    fee,
    simulatedPositionTransition: simulatedAdjustUp,
    args,
    dependencies,
    quoteSwapData,
  })
}