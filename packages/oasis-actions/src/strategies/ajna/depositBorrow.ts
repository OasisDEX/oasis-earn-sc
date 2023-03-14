import * as ethers from 'ethers'

import ajnaProxyActionsAbi from '../../../../../abi/external/ajna/ajnaProxyActions.json'
import { AjnaPosition } from '../../types/ajna'
import { Strategy } from '../../types/common'
import { Dependencies, OpenArgs } from './open'

export interface DepositBorrowArgs extends Omit<OpenArgs, 'collateralPrice' | 'quotePrice'> {
  position: AjnaPosition
}

export async function depositBorrow(
  args: DepositBorrowArgs,
  dependencies: Dependencies,
): Promise<Strategy<AjnaPosition>> {
  const isDepositingEth =
    args.position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const apa = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  const data = apa.interface.encodeFunctionData('depositAndDraw', [
    args.poolAddress,
    ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
    ethers.utils
      .parseUnits(args.collateralAmount.toString(), args.collateralTokenPrecision)
      .toString(),
    args.price.toString(),
  ])

  const targetPosition = args.position.deposit(args.collateralAmount).borrow(args.quoteAmount)

  return {
    simulation: {
      swaps: [],
      targetPosition,
      position: targetPosition,
      errors: [],
      warnings: [],
    },
    tx: {
      to: dependencies.ajnaProxyActions,
      data,
      value: isDepositingEth
        ? ethers.utils.parseEther(args.collateralAmount.toString()).toString()
        : '0',
    },
  }
}
