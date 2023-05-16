import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import { Address } from '@deploy-configurations/types/address'
import { prepareAjnaPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { AjnaPosition } from '@dma-library/types/ajna'
import { Strategy } from '@dma-library/types/common'
import { views } from '@dma-library/views'
import { GetPoolData } from '@dma-library/views/ajna'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import {
  validateBorrowUndercollateralized,
  validateDustLimit,
  validateLiquidity,
} from './validation'

export interface OpenArgs {
  poolAddress: Address
  dpmProxyAddress: Address
  collateralPrice: BigNumber
  quotePrice: BigNumber
  quoteAmount: BigNumber
  quoteTokenPrecision: number
  collateralAmount: BigNumber
  collateralTokenPrecision: number
}

export interface Dependencies {
  poolInfoAddress: Address
  ajnaProxyActions: Address
  provider: ethers.providers.Provider
  WETH: Address
  getPoolData: GetPoolData
  getPosition?: typeof views.ajna.getPosition
}

export type AjnaOpenBorrowStrategy = (
  args: OpenArgs,
  dependencies: Dependencies,
) => Promise<Strategy<AjnaPosition>>

export const open: AjnaOpenBorrowStrategy = async (args, dependencies) => {
  const getPosition = dependencies.getPosition ? dependencies.getPosition : views.ajna.getPosition
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
