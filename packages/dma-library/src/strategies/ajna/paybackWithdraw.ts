import { Address } from '@dma-deployments/types/address'
import { prepareAjnaPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import ajnaProxyActionsAbi from '@oasisdex/abis/external/protocols/ajna/ajnaProxyActions.json'
import BigNumber from 'bignumber.js'
import * as ethers from 'ethers'

import { AjnaPosition } from '../../types/ajna'
import { Strategy } from '../../types/common'
import { Dependencies } from './open'
import {
  validateDustLimit,
  // validateOverRepay,
  validateOverWithdraw,
  validateWithdrawUndercollateralized,
} from './validation'
import { validateWithdrawCloseToMaxLtv } from './validation/closeToMaxLtv'

interface PaybackWithdrawArgs {
  poolAddress: Address
  dpmProxyAddress: Address
  quoteAmount: BigNumber
  quoteTokenPrecision: number
  collateralAmount: BigNumber
  collateralTokenPrecision: number
  position: AjnaPosition
}

export async function paybackWithdraw(
  args: PaybackWithdrawArgs,
  dependencies: Dependencies,
): Promise<Strategy<AjnaPosition>> {
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
  ])

  const targetPosition = args.position.payback(args.quoteAmount).withdraw(args.collateralAmount)

  const isPayingBackEth =
    args.position.pool.quoteToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const errors = [
    ...validateDustLimit(targetPosition),
    ...validateWithdrawUndercollateralized(targetPosition, args.position),
    ...validateOverWithdraw(args.position, args.collateralAmount),
    // ...validateOverRepay(args.position, args.quoteAmount),
  ]

  const warnings = [...validateWithdrawCloseToMaxLtv(targetPosition, args.position)]

  return prepareAjnaPayload({
    dependencies,
    targetPosition,
    errors,
    warnings,
    data,
    txValue: resolveAjnaEthAction(isPayingBackEth, args.quoteAmount),
  })
}
