import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import { Address } from '@dma-deployments/types/address'
import { prepareAjnaPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { AjnaPosition } from '@dma-library/types/ajna'
import { Strategy } from '@dma-library/types/common'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import { Dependencies } from './open'
import {
  validateDustLimit,
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
    ...validateOverWithdraw(targetPosition, args.position, args.collateralAmount),
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
