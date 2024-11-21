import { amountToWei } from '@dma-common/utils/common'
import { getAaveTokenAddress } from '@dma-library/strategies/aave/common'
import { AaveLikeAdjustDown } from '@dma-library/strategies/aave-like/multiply/adjust/types'
import { AaveLikeTokens } from '@dma-library/types'
import { getPositionDataAaveLike } from '@dma-library/utils/fee-service'
import { feeResolver, getSwapDataHelper } from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

import { buildOperation } from './build-operation'
import { generate } from './generate'
import { simulate } from './simulate'

export const adjustRiskDown: AaveLikeAdjustDown = async (args, dependencies) => {
  const isAdjustDown = true
  const isAdjustUp = !isAdjustDown

  const fee = await feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: isAdjustUp,
    isEarnPosition: dependencies.positionType === 'Earn',
    positionData: await getPositionDataAaveLike(dependencies),
  })

  // Get quote swap
  const estimatedSwapAmount = amountToWei(new BigNumber(1), args.collateralToken.precision)
  const { swapData: quoteSwapData } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AaveLikeTokens
  >({
    args: {
      fromToken: args.collateralToken,
      toToken: args.debtToken,
      slippage: args.slippage,
      fee: fee.feeToCharge,
      feeType: fee.feeType,
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
    { ...args, fee: fee.feeToCharge, feeType: fee.feeType },
    dependencies,
    false,
  )

  // Get accurate swap
  const { swapData, collectFeeFrom, preSwapFee } = await getSwapDataHelper<
    typeof dependencies.addresses,
    AaveLikeTokens
  >({
    args: {
      fromToken: args.collateralToken,
      toToken: args.debtToken,
      slippage: args.slippage,
      fee: fee.feeToCharge,
      feeType: fee.feeType,
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
    preSwapFee,
    simulation: simulatedAdjustDown,
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
    fee: fee.feeToCharge,
    feeType: fee.feeType,
    simulation: simulatedAdjustDown,
    args,
    dependencies,
    quoteSwapData,
  })
}
