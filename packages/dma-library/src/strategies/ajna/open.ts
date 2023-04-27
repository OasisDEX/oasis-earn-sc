import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import { Address } from '@dma-deployments/types/address'
import { AjnaPosition } from '@dma-library/types/ajna'
import { Strategy } from '@dma-library/types/common'
import { views } from '@dma-library/views'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export interface OpenArgs {
  poolAddress: Address
  dpmProxyAddress: Address
  quoteAmount: BigNumber
  quoteTokenPrecision: number
  collateralAmount: BigNumber
  collateralTokenPrecision: number
  price: BigNumber
}

export interface Dependencies {
  poolInfoAddress: Address
  ajnaProxyActions: Address
  provider: ethers.providers.Provider
  WETH: Address
}

export async function open(
  args: OpenArgs,
  dependencies: Dependencies,
): Promise<Strategy<AjnaPosition>> {
  const position = await views.ajna.getPosition(
    {
      proxyAddress: args.dpmProxyAddress,
      poolAddress: args.poolAddress,
    },
    {
      poolInfoAddress: dependencies.poolInfoAddress,
      provider: dependencies.provider,
    },
  )

  if (position.collateralAmount.gt(0)) {
    throw new Error('Position already exists')
  }

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
    args.price.toString(),
  ])

  const targetPosition = position.deposit(args.collateralAmount).borrow(args.quoteAmount)

  return {
    simulation: {
      swaps: [],
      targetPosition,
      position: targetPosition,
      errors: targetPosition.errors,
    },
    tx: {
      to: dependencies.ajnaProxyActions,
      data,
      value: isDepositingEth
        ? ethers.utils.parseUnits(args.collateralAmount.toString(), 18).toString()
        : '0',
    },
  }
}
