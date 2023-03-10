import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import ajnaProxyActionsAbi from '../../../../../../abi/external/ajna/ajnaProxyActions.json'
import poolInfoAbi from '../../../../../../abi/external/ajna/poolInfoUtils.json'
import { ZERO } from '../../../helpers/constants'
import { AjnaEarnPosition } from '../../../types/ajna'
import { Address, Strategy } from '../../../types/common'
import bucketPrices from './buckets.json'

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
}

export async function depositAndAdjust(
  args: Args,
  dependencies: Dependencies,
): Promise<Strategy<AjnaEarnPosition>> {
  const isDepositingEth =
    args.position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()
  const isPositionStaked = args.position.stakedNftId !== null
  const isDepositing = args.quoteAmount.gt(ZERO)
  const isAdjusting = !args.price.eq(args.position.price)

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

  const indexToPrice = new BigNumber(bucketPrices[args.position.priceIndex!.toNumber()])

  const priceToIndex = await poolInfo
    .priceToIndex(args.price.shiftedBy(18).toString())
    .then((res: any) => res.toString())
    .then((res: string) => new BigNumber(res))

  let data: string | null = null

  if (isPositionStaked && isDepositing && isAdjusting) {
    // supplyAndMoveQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('supplyAndMoveQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
      args.position.stakedNftId,
    ])
  }

  if (isPositionStaked && !isDepositing && isAdjusting) {
    // moveQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuoteNft', [
      args.poolAddress,
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
      args.position.stakedNftId,
    ])
  }

  if (isPositionStaked && isDepositing && !isAdjusting) {
    // supplyQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('supplyQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      args.price.shiftedBy(18).toString(),
      args.position.stakedNftId,
    ])
  }

  if (!isPositionStaked && isDepositing && isAdjusting) {
    // supplyAndMoveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('supplyAndMoveQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
    ])
  }

  if (!isPositionStaked && !isDepositing && isAdjusting) {
    // moveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuote', [
      args.poolAddress,
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
    ])
  }

  if (!isPositionStaked && isDepositing && !isAdjusting) {
    // supplyQuote
    data = ajnaProxyActions.interface.encodeFunctionData('supplyQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      args.price.shiftedBy(18).toString(),
    ])
  }

  if (data === null) {
    throw new Error('Data is null')
  }

  // TODO we need correct targetPosition per each operation, moveQuote is hardcoded for all now
  const targetPosition = args.position.moveQuote(priceToIndex)

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
