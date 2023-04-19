import { AjnaEarnPosition } from '@dma-library/types/ajna'
import { Strategy } from '@dma-library/types/common'
import * as views from '@dma-library/views'
import { GetEarnData } from '@dma-library/views/ajna'
import ajnaProxyActionsAbi from '@oasisdex/abis/external/protocols/ajna/ajnaProxyActions.json'
import { ZERO } from '@oasisdex/dma-common/constants'
import { Address } from '@oasisdex/dma-deployments/types/address'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

interface Args {
  poolAddress: Address
  dpmProxyAddress: Address
  quoteAmount: BigNumber
  quoteTokenPrecision: number
  price: BigNumber
  position: AjnaEarnPosition
}

export interface Dependencies {
  poolInfoAddress: Address
  ajnaProxyActions: Address
  provider: ethers.providers.Provider
  WETH: Address
  getEarnData: GetEarnData
}

export async function depositAndAdjust(
  args: Args,
  dependencies: Dependencies,
): Promise<Strategy<AjnaEarnPosition>> {
  const position = await views.ajna.getEarnPosition(
    {
      proxyAddress: args.dpmProxyAddress,
      poolAddress: args.poolAddress,
    },
    {
      getEarnData: dependencies.getEarnData,
      poolInfoAddress: dependencies.poolInfoAddress,
      provider: dependencies.provider,
    },
  )

  const isDepositingEth =
    position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()
  const isPositionStaked = position.stakedNftId !== null
  const isDepositing = args.quoteAmount.gt(ZERO)
  const isAdjusting = !args.price.eq(position.price)

  const ajnaProxyActions = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  let data: string | null = null

  if (isPositionStaked && isDepositing && isAdjusting) {
    // supplyAndMoveQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('supplyAndMoveQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      ethers.utils.parseUnits(position.price.toString(), 3).toString(),
      ethers.utils.parseUnits(args.price.toString(), 3).toString(),
      args.position.stakedNftId,
    ])
  }

  if (isPositionStaked && !isDepositing && isAdjusting) {
    // moveQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(position.price.toString(), 3).toString(),
      ethers.utils.parseUnits(args.price.toString(), 3).toString(),
      args.position.stakedNftId,
    ])
  }

  if (isPositionStaked && isDepositing && !isAdjusting) {
    // supplyQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('supplyQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      ethers.utils.parseUnits(args.price.toString(), 3).toString(),
      args.position.stakedNftId,
    ])
  }

  if (!isPositionStaked && isDepositing && isAdjusting) {
    // supplyAndMoveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('supplyAndMoveQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      ethers.utils.parseUnits(position.price.toString(), 3).toString(),
      ethers.utils.parseUnits(args.price.toString(), 3).toString(),
    ])
  }

  if (!isPositionStaked && !isDepositing && isAdjusting) {
    // moveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(position.price.toString(), 3).toString(),
      ethers.utils.parseUnits(args.price.toString(), 3).toString(),
    ])
  }

  if (!isPositionStaked && isDepositing && !isAdjusting) {
    // supplyQuote
    data = ajnaProxyActions.interface.encodeFunctionData('supplyQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      ethers.utils.parseUnits(args.price.toString(), 3).toString(),
    ])
  }

  if (data === null) {
    throw new Error('Data is null')
  }

  const targetPosition = position.deposit(args.quoteAmount)

  return {
    simulation: {
      swaps: [],
      errors: [],
      targetPosition,
      position: targetPosition,
    },
    tx: {
      to: dependencies.ajnaProxyActions,
      data,
      value: isDepositingEth
        ? ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString()
        : '0',
    },
  }
}
