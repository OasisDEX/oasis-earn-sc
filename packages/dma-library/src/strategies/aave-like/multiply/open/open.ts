import { amountToWei } from '@dma-common/utils/common'
import { getAaveTokenAddress } from '@dma-library/strategies/aave/common'
import { AaveLikeTokens } from '@dma-library/types/aave-like'
import * as SwapUtils from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

import { buildOperation } from './build-operation'
import { generate } from './generate'
import { simulate } from './simulate'
import { AaveLikeOpen } from './types'

export const open: AaveLikeOpen = async (args, dependencies) => {
  const fee = SwapUtils.feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: true,
    isEarnPosition: dependencies.positionType === 'Earn',
  })

  const estimatedSwapAmount = amountToWei(new BigNumber(1), args.debtToken.precision)

  const { swapData: quoteSwapData } = await SwapUtils.getSwapDataHelper<
    typeof dependencies.addresses,
    AaveLikeTokens
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

  const { simulatedPositionTransition, reserveEModeCategory, flashloanTokenAddress } =
    await simulate(
      quoteSwapData,
      {
        ...args,
        fee,
      },
      dependencies,
      true,
    )

  const { swapData, collectFeeFrom } = await SwapUtils.getSwapDataHelper<
    typeof dependencies.addresses,
    AaveLikeTokens
  >({
    args: {
      fromToken: args.debtToken,
      toToken: args.collateralToken,
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees: simulatedPositionTransition.swap.fromTokenAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddress: getAaveTokenAddress,
    },
  })

  const operation = await buildOperation(
    swapData,
    simulatedPositionTransition,
    collectFeeFrom,
    reserveEModeCategory,
    { ...args, flashloanToken: flashloanTokenAddress },
    dependencies,
  )

  if (operation === undefined) throw new Error('No operation built. Check your arguments.')

  return await generate({
    swapData,
    operation,
    args,
    collectFeeFrom,
    fee,
    dependencies,
    simulatedPositionTransition,
    quoteSwapData,
  })
}
