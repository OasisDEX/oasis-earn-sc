import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import { prepareAjnaPayload, resolveTxValue } from '@dma-library/protocols/ajna'
import { ajnaBuckets } from '@dma-library/strategies'
import { validateLiquidationPriceCloseToMarketPrice } from '@dma-library/strategies/ajna/validation/borrowish/liquidationPriceCloseToMarket'
import {
  AjnaBorrowPayload,
  AjnaCommonDependencies,
  AjnaPosition,
  SummerStrategy,
} from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import { validateGenerateCloseToMaxLtv } from '../../validation/closeToMaxLtv'
import {
  validateBorrowUndercollateralized,
  validateDustLimit,
  validateLiquidity,
} from '../validation'

export type AjnaDepositBorrowStrategy = (
  args: AjnaBorrowPayload,
  dependencies: AjnaCommonDependencies,
) => Promise<SummerStrategy<AjnaPosition>>

export const depositBorrow: AjnaDepositBorrowStrategy = async (args, dependencies) => {
  const isDepositingEth =
    args.position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const apa = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  const limitIndex = new BigNumber(ajnaBuckets[ajnaBuckets.length - 1])

  const data = apa.interface.encodeFunctionData('depositAndDraw', [
    args.poolAddress,
    ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
    ethers.utils
      .parseUnits(args.collateralAmount.toString(), args.collateralTokenPrecision)
      .toString(),
    limitIndex.toString(),
    args.stamploanEnabled ?? false,
  ])

  const targetPosition = args.position.deposit(args.collateralAmount).borrow(args.quoteAmount)

  const errors = [
    ...validateDustLimit(targetPosition),
    ...validateBorrowUndercollateralized(targetPosition, args.position, args.quoteAmount),
    ...validateLiquidity(targetPosition, args.position, args.quoteAmount),
  ]

  const warnings = [
    ...validateGenerateCloseToMaxLtv(targetPosition, args.position),
    ...validateLiquidationPriceCloseToMarketPrice(targetPosition),
  ]

  return prepareAjnaPayload({
    dependencies,
    targetPosition,
    errors,
    warnings,
    notices: [],
    successes: [],
    data,
    txValue: resolveTxValue(isDepositingEth, args.collateralAmount),
  })
}
