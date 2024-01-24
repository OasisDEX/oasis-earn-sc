import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import { prepareAjnaPayload, resolveTxValue } from '@dma-library/protocols/ajna'
import { validateLiquidationPriceCloseToMarketPrice } from '@dma-library/strategies/ajna/validation/borrowish/liquidationPriceCloseToMarket'
import {
  AjnaBorrowPayload,
  AjnaCommonDependencies,
  AjnaPosition,
  SummerStrategy,
} from '@dma-library/types/ajna'
import { ethers } from 'ethers'

import { validateWithdrawCloseToMaxLtv } from '../../validation/closeToMaxLtv'
import {
  validateDustLimit,
  validateOverWithdraw,
  validateWithdrawUndercollateralized,
} from '../validation'

export type AjnaPaybackWithdrawStrategy = (
  args: AjnaBorrowPayload,
  dependencies: AjnaCommonDependencies,
) => Promise<SummerStrategy<AjnaPosition>>

export const paybackWithdraw: AjnaPaybackWithdrawStrategy = async (args, dependencies) => {
  const apa = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  const data = apa.interface.encodeFunctionData('repayWithdraw', [
    args.poolAddress,
    ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
    ethers.utils
      .parseUnits(args.collateralAmount.toString(), args.collateralTokenPrecision)
      .toString(),
    args.stamploanEnabled ?? false,
  ])

  const targetPosition = args.position.payback(args.quoteAmount).withdraw(args.collateralAmount)

  const isPayingBackEth =
    args.position.pool.quoteToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const errors = [
    ...validateDustLimit(targetPosition),
    ...validateWithdrawUndercollateralized(targetPosition, args.position),
    ...validateOverWithdraw(targetPosition, args.position, args.collateralAmount),
  ]

  const warnings = [
    ...validateWithdrawCloseToMaxLtv(targetPosition, args.position),
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
    txValue: resolveTxValue(isPayingBackEth, args.quoteAmount),
  })
}
