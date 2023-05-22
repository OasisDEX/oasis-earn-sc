import { Address } from '@deploy-configurations/types/address'
import { prepareAjnaPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { AjnaPosition } from '@dma-library/types/ajna'
import { Strategy } from '@dma-library/types/common'
import { views } from '@dma-library/views'
import { GetPoolData } from '@dma-library/views/ajna'
import { IRiskRatio } from '@domain/risk-ratio'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export interface OpenMultiplyArgs {
  poolAddress: Address
  dpmProxyAddress: Address
  collateralPrice: BigNumber
  quotePrice: BigNumber
  quoteAmount: BigNumber
  quoteTokenPrecision: number
  collateralAmount: BigNumber
  collateralTokenPrecision: number
  multiple: IRiskRatio
}

export interface Dependencies {
  poolInfoAddress: Address
  ajnaProxyActions: Address
  provider: ethers.providers.Provider
  WETH: Address
  getPoolData: GetPoolData
  getPosition?: typeof views.ajna.getPosition
}

export type AjnaOpenMultiplyStrategy = (
  args: OpenMultiplyArgs,
  dependencies: Dependencies,
) => Promise<Strategy<AjnaPosition>>

export const openMultiply: AjnaOpenMultiplyStrategy = async (args, dependencies) => {
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

  const isDepositingEth =
    position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const targetPosition = position.deposit(args.collateralAmount).borrow(args.quoteAmount)

  return prepareAjnaPayload({
    dependencies,
    targetPosition,
    data: '',
    errors: [],
    warnings: [],
    txValue: resolveAjnaEthAction(isDepositingEth, args.collateralAmount),
  })
}
