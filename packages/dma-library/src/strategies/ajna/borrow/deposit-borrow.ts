import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import { prepareAjnaPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { ajnaBuckets } from '@dma-library/strategies'
import {
  AjnaBorrowPayload,
  AjnaCommonDependencies,
  AjnaPosition,
  Strategy,
} from '@dma-library/types/ajna'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import {
  // validateBorrowUndercollateralized,
  validateDustLimit,
  // validateLiquidity,
} from '../validation'
import { validateGenerateCloseToMaxLtv } from '../validation/borrowish/closeToMaxLtv'

export type AjnaDepositBorrowStrategy = (
  args: AjnaBorrowPayload,
  dependencies: AjnaCommonDependencies,
) => Promise<Strategy<AjnaPosition>>

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
  ])

  const targetPosition = args.position.deposit(args.collateralAmount).borrow(args.quoteAmount)

  const errors = [
    ...validateDustLimit(targetPosition),
    // ...validateBorrowUndercollateralized(targetPosition, args.position, args.quoteAmount),
    // ...validateLiquidity(targetPosition, args.position, args.quoteAmount),
  ]

  const warnings = [...validateGenerateCloseToMaxLtv(targetPosition, args.position)]

  return prepareAjnaPayload({
    dependencies,
    targetPosition,
    errors,
    warnings,
    notices: [],
    successes: [],
    data,
    txValue: resolveAjnaEthAction(isDepositingEth, args.collateralAmount),
  })
}
