import BigNumber from 'bignumber.js'
import * as ethers from 'ethers'

import ajnaProxyActionsAbi from '../../abi/ajna/ajnaProxyActions.json'
// import poolInfoAbi from '../../abi/ajna/poolInfoUtils.json'
import { AjnaPosition } from '../../types/ajna'
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

  return {
    simulation: {
      swaps: [],
      targetPosition,
    },
    tx: {
      to: dependencies.ajnaProxyActions,
      data,
      value: '0',
    },
  }
}
