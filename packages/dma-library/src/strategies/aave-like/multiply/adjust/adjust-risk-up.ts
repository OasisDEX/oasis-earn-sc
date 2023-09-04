import { amountToWei } from '@dma-common/utils/common'
import { getAaveTokenAddress } from '@dma-library/strategies/aave/common'
import { AAVETokens } from '@dma-library/types'
import { feeResolver, getSwapDataHelper } from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

import { buildOperation } from './build-operation'
import { generate } from './generate'
import { simulate } from './simulate'
import { AaveLikeAdjustUp } from './types'

export const adjustRiskUp: AaveLikeAdjustUp = async (args, dependencies) => {
  const isAdjustUp = true
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: isAdjustUp,
    isEarnPosition: dependencies.positionType === 'Earn',
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
  const { simulatedPositionTransition: simulatedAdjustUp } = await simulate(
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

  return await generate({
    isIncreasingRisk: isAdjustUp,
    swapData,
    operation,
    collectFeeFrom,
    fee,
    simulation: simulatedAdjustUp,
    args,
    dependencies,
    quoteSwapData,
  })
}
