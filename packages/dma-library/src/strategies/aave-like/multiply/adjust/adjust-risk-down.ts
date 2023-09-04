import { amountToWei } from '@dma-common/utils/common'
import { getAaveTokenAddress } from '@dma-library/strategies/aave/common'
import { AaveLikeAdjustUp } from '@dma-library/strategies/aave-like/multiply/adjust/types'
import { AAVETokens } from '@dma-library/types'
import { feeResolver, getSwapDataHelper } from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

import { buildOperation } from './build-operation'
import { generate } from './generate'
import { simulate } from './simulate'

export const adjustRiskDown: AaveLikeAdjustUp = async (args, dependencies) => {
  const isAdjustDown = true
  const isAdjustUp = !isAdjustDown
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: isAdjustUp,
    isEarnPosition: dependencies.positionType === 'Earn',
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
  const { simulatedPositionTransition: simulatedAdjustDown } = await simulate(
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

  return await generate({
    isIncreasingRisk: isAdjustUp,
    swapData,
    operation,
    collectFeeFrom,
    fee,
    simulation: simulatedAdjustDown,
    args,
    dependencies,
    quoteSwapData,
  })
}
