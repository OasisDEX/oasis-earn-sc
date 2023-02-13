import BigNumber from 'bignumber.js'
import * as ethers from 'ethers'

import ajnaProxyActionsAbi from '../../../../../abi/external/ajna/ajnaProxyActions.json'
import { AjnaPosition } from '../../helpers/ajna'
import { Address, Strategy } from '../../types/common'
import { Dependencies } from './open'

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
    ethers.utils.parseUnits(args.collateralAmount.toString(), args.quoteTokenPrecision).toString(),
  ])

  const targetPosition = args.position.payback(args.quoteAmount).withdraw(args.collateralAmount)

  const isPayingBackEth =
    args.position.pool.quoteToken.toLowerCase() === dependencies.WETH.toLowerCase()

  return {
    simulation: {
      swaps: [],
      targetPosition,
      position: targetPosition,
    },
    tx: {
      to: dependencies.ajnaProxyActions,
      data,
      value: isPayingBackEth
        ? ethers.utils.parseEther(args.quoteAmount.toString()).toString()
        : '0',
    },
  }
}
