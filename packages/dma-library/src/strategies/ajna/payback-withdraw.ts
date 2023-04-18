import { AjnaPosition } from '@dma-library/types/ajna'
import { Strategy } from '@dma-library/types/common'
import ajnaProxyActionsAbi from '@oasisdex/abis/external/protocols/ajna/ajnaProxyActions.json'
import { Address } from '@oasisdex/dma-common/types/address'
import BigNumber from 'bignumber.js'
import * as ethers from 'ethers'

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
      errors: [],
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
