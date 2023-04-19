import { AjnaEarnPosition } from '@dma-library/types/ajna'
import { Strategy } from '@dma-library/types/common'
import * as views from '@dma-library/views'
import { GetEarnData } from '@dma-library/views/ajna'
import ajnaProxyActionsAbi from '@oasisdex/abis/external/protocols/ajna/ajnaProxyActions.json'
import poolInfoAbi from '@oasisdex/abis/external/protocols/ajna/poolInfoUtils.json'
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

export async function withdrawAndAdjust(
  args: Args,
  dependencies: Dependencies,
): Promise<Strategy<AjnaEarnPosition>> {
  const position = await views.ajna.getEarnPosition(
    {
      proxyAddress: args.dpmProxyAddress,
      poolAddress: args.poolAddress,
    },
    {
      poolInfoAddress: dependencies.poolInfoAddress,
      provider: dependencies.provider,
      getEarnData: dependencies.getEarnData,
    },
  )

  const isDepositingEth =
    position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()
  const isPositionStaked = args.position.stakedNftId !== null
  const isWithdrawing = args.quoteAmount.gt(ZERO)
  const isAdjusting = !args.price.eq(position.price)

  const ajnaProxyActions = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  const poolInfo = new ethers.Contract(
    dependencies.poolInfoAddress,
    poolInfoAbi,
    dependencies.provider,
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const priceIndex = await poolInfo
    .priceToIndex(ethers.utils.parseUnits(args.price.toString(), 18).toString())
    .then((res: any) => res.toString())
    .then((res: string) => new BigNumber(res))

  let data: string | null = null

  if (isPositionStaked && isWithdrawing && isAdjusting) {
    // withdrawAndMoveQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawAndMoveQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      ethers.utils.parseUnits(position.price.toString(), 3).toString(),
      ethers.utils.parseUnits(args.price.toString(), 3).toString(),
      args.position.stakedNftId,
    ])
  }

  if (isPositionStaked && !isWithdrawing && isAdjusting) {
    // moveQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(position.price.toString(), 3).toString(),
      ethers.utils.parseUnits(args.price.toString(), 3).toString(),
      args.position.stakedNftId,
    ])
  }

  if (isPositionStaked && isWithdrawing && !isAdjusting) {
    // withdrawQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      ethers.utils.parseUnits(position.price.toString(), 3).toString(),
      args.position.stakedNftId,
    ])
  }

  if (!isPositionStaked && isWithdrawing && isAdjusting) {
    // withdrawAndMoveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawAndMoveQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      ethers.utils.parseUnits(position.price.toString(), 3).toString(),
      ethers.utils.parseUnits(args.price.toString(), 3).toString(),
    ])
  }

  if (!isPositionStaked && !isWithdrawing && isAdjusting) {
    // moveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(position.price.toString(), 3).toString(),
      ethers.utils.parseUnits(args.price.toString(), 3).toString(),
    ])
  }

  if (!isPositionStaked && isWithdrawing && !isAdjusting) {
    // withdrawQuote
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      ethers.utils.parseUnits(position.price.toString(), 3).toString(),
    ])
  }

  if (data === null) {
    throw new Error('Data is null')
  }

  const targetPosition = position.withdraw(args.quoteAmount)

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
