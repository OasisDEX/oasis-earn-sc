import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import { prepareAjnaPayload, resolveTxValue } from '@dma-library/protocols/ajna'
import { ajnaBuckets } from '@dma-library/strategies'
import { validateLiquidationPriceCloseToMarketPrice } from '@dma-library/strategies/ajna/validation/borrowish/liquidationPriceCloseToMarket'
import { validateGenerateCloseToMaxLtv } from '@dma-library/strategies/validation/closeToMaxLtv'
import { AjnaCommonDependencies, AjnaPosition, SummerStrategy } from '@dma-library/types/ajna'
import { AjnaOpenBorrowPayload } from '@dma-library/types/ajna/ajna-dependencies'
import { views } from '@dma-library/views'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import {
  validateBorrowUndercollateralized,
  validateDustLimit,
  validateLiquidity,
} from '../validation'

export type AjnaOpenBorrowStrategy = (
  args: AjnaOpenBorrowPayload,
  dependencies: AjnaCommonDependencies,
) => Promise<SummerStrategy<AjnaPosition>>

export const open: AjnaOpenBorrowStrategy = async (args, dependencies) => {
  const getPosition = views.ajna.getPosition
  const position = await getPosition(
    {
      collateralPrice: args.collateralPrice,
      quotePrice: args.quotePrice,
      proxyAddress: args.dpmProxyAddress,
      poolAddress: args.poolAddress,
      collateralToken: args.collateralToken,
      quoteToken: args.quoteToken,
    },
    {
      poolInfoAddress: dependencies.poolInfoAddress,
      provider: dependencies.provider,
      getPoolData: dependencies.getPoolData,
      getCumulatives: dependencies.getCumulatives,
    },
  )

  if (position.collateralAmount.gt(0)) {
    throw new Error('Position already exists')
  }

  const limitIndex = new BigNumber(ajnaBuckets[ajnaBuckets.length - 1])

  const isDepositingEth =
    position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const ajnaProxyActions = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  const data = ajnaProxyActions.interface.encodeFunctionData('openPosition', [
    args.poolAddress,
    ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
    ethers.utils
      .parseUnits(args.collateralAmount.toString(), args.collateralTokenPrecision)
      .toString(),
    limitIndex.toString(),
  ])

  const targetPosition = position.deposit(args.collateralAmount).borrow(args.quoteAmount)

  const errors = [
    ...validateDustLimit(targetPosition),
    ...validateLiquidity(targetPosition, position, args.quoteAmount),
    ...validateBorrowUndercollateralized(targetPosition, position, args.quoteAmount),
  ]

  const warnings = [
    ...validateGenerateCloseToMaxLtv(targetPosition, position),
    ...validateLiquidationPriceCloseToMarketPrice(targetPosition),
  ]

  return prepareAjnaPayload({
    dependencies,
    targetPosition,
    data,
    errors,
    notices: [],
    successes: [],
    warnings,
    txValue: resolveTxValue(isDepositingEth, args.collateralAmount),
  })
}
