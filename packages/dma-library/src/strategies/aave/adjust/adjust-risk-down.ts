import { amountToWei } from '@dma-common/utils/common'
import { getAaveTokenAddress } from '@dma-library/strategies'
import { buildOperation } from '@dma-library/strategies/aave/adjust/build-operation'
import { generateTransition } from '@dma-library/strategies/aave/adjust/generate-transition'
import { simulatePositionTransition } from '@dma-library/strategies/aave/adjust/simulate-position-transition'
import { AaveAdjustArgs, AaveAdjustDependencies } from '@dma-library/strategies/aave/adjust/types'
import { AAVETokens, PositionTransition } from '@dma-library/types'
import { feeResolver, getSwapDataHelper } from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

export async function adjustRiskDown(
  args: AaveAdjustArgs,
  dependencies: AaveAdjustDependencies,
): Promise<PositionTransition> {
  const isAdjustDown = true
  const isAdjustUp = !isAdjustDown
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: isAdjustUp,
    isEarnPosition: args.positionType === 'Earn',
  })

  // Get quote swap
  const estimatedSwapAmount = amountToWei(new BigNumber(1), args.collateralToken.precision)
  const { swapData: quoteSwapData } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    args: {
      fromToken: args.collateralToken,
      toToken: args.debtToken,
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

  // SimulateAdjustDown
  const { simulatedPositionTransition: simulatedAdjustDown } = await simulatePositionTransition(
    isAdjustUp,
    quoteSwapData,
    { ...args, fee },
    dependencies,
    false,
  )

  // Get accurate swap
  const { swapData, collectFeeFrom } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    args: {
      fromToken: args.collateralToken,
      toToken: args.debtToken,
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees: simulatedAdjustDown.swap.fromTokenAmount,
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
    simulatedPositionTransition: simulatedAdjustDown,
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
    simulatedPositionTransition: simulatedAdjustDown,
    args,
    dependencies,
    quoteSwapData,
  })
}
