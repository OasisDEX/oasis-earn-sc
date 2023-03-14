import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import ajnaProxyActionsAbi from '../../../../../../abi/external/ajna/ajnaProxyActions.json'
import poolInfoAbi from '../../../../../../abi/external/ajna/poolInfoUtils.json'
import { AjnaEarnArgs, getAjnaEarnActionOutput } from '../../../helpers/ajna'
import { ZERO } from '../../../helpers/constants'
import { AjnaEarnPosition } from '../../../types/ajna'
import { AjnaDependencies, Strategy } from '../../../types/common'
import bucketPrices from './buckets.json'

export async function depositAndAdjust(
  args: AjnaEarnArgs,
  dependencies: AjnaDependencies,
): Promise<Strategy<AjnaEarnPosition>> {
  const action = 'deposit'
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

  let data = ''
  let targetPosition: AjnaEarnPosition | null = null

  if (isPositionStaked && isDepositing && isAdjusting) {
    // supplyAndMoveQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('supplyAndMoveQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
      args.position.stakedNftId,
    ])
    targetPosition = args.position.moveQuote(priceToIndex).deposit(args.quoteAmount)
  }

  if (isPositionStaked && !isDepositing && isAdjusting) {
    // moveQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuoteNft', [
      args.poolAddress,
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
      args.position.stakedNftId,
    ])
    targetPosition = args.position.moveQuote(priceToIndex)
  }

  if (isPositionStaked && isDepositing && !isAdjusting) {
    // supplyQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('supplyQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      args.price.shiftedBy(18).toString(),
      args.position.stakedNftId,
    ])
    targetPosition = args.position.deposit(args.quoteAmount)
  }

  if (!isPositionStaked && isDepositing && isAdjusting) {
    // supplyAndMoveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('supplyAndMoveQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.moveQuote(priceToIndex).deposit(args.quoteAmount)
  }

  if (!isPositionStaked && !isDepositing && isAdjusting) {
    // moveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuote', [
      args.poolAddress,
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.moveQuote(priceToIndex)
  }

  if (!isPositionStaked && isDepositing && !isAdjusting) {
    // supplyQuote
    data = ajnaProxyActions.interface.encodeFunctionData('supplyQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.deposit(args.quoteAmount)
  }

  if (!data || !targetPosition) throw new Error('Invalid depositAndAdjust params')

  return getAjnaEarnActionOutput({ targetPosition, data, dependencies, args, action })
}
