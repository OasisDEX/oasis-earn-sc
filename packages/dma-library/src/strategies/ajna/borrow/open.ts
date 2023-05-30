import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import { prepareAjnaPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { AjnaCommonDependencies, AjnaPosition, Strategy } from '@dma-library/types/ajna'
import { AjnaOpenBorrowPayload } from '@dma-library/types/ajna/ajna-dependencies'
import { views } from '@dma-library/views'
import { ethers } from 'ethers'

import {
  validateBorrowUndercollateralized,
  validateDustLimit,
  validateLiquidity,
} from '../validation'

export type AjnaOpenBorrowStrategy = (
  args: AjnaOpenBorrowPayload,
  dependencies: AjnaCommonDependencies,
) => Promise<Strategy<AjnaPosition>>

export const open: AjnaOpenBorrowStrategy = async (args, dependencies) => {
  const getPosition = views.ajna.getPosition
  const position = await getPosition(
    {
      collateralPrice: args.collateralPrice,
      quotePrice: args.quotePrice,
      proxyAddress: args.dpmProxyAddress,
      poolAddress: args.poolAddress,
    },
    {
      poolInfoAddress: dependencies.poolInfoAddress,
      provider: dependencies.provider,
      getPoolData: dependencies.getPoolData,
    },
  )

  if (position.collateralAmount.gt(0)) {
    throw new Error('Position already exists')
  }

  const htp = position.pool.highestThresholdPrice.shiftedBy(18)

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
    htp.toString(),
  ])

  const targetPosition = position.deposit(args.collateralAmount).borrow(args.quoteAmount)

  const errors = [
    ...validateDustLimit(targetPosition),
    ...validateLiquidity(position, args.quoteAmount),
    ...validateBorrowUndercollateralized(targetPosition, position),
  ]

  return prepareAjnaPayload({
    dependencies,
    targetPosition,
    data,
    errors,
    warnings: [],
    txValue: resolveAjnaEthAction(isDepositingEth, args.collateralAmount),
  })
}
