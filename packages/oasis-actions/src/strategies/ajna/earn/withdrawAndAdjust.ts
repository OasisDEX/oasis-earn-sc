/* eslint-disable @typescript-eslint/no-non-null-assertion */
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import ajnaProxyActionsAbi from '../../../../../../abi/external/ajna/ajnaProxyActions.json'
import poolInfoAbi from '../../../../../../abi/external/ajna/poolInfoUtils.json'
import { AjnaEarnArgs, getAjnaEarnActionOutput } from '../../../helpers/ajna'
import { ZERO } from '../../../helpers/constants'
import { AjnaEarnPosition } from '../../../types/ajna'
import { AjnaDependencies, Strategy } from '../../../types/common'
import bucketPrices from './buckets.json'

export async function withdrawAndAdjust(
  args: AjnaEarnArgs,
  dependencies: AjnaDependencies,
): Promise<Strategy<AjnaEarnPosition>> {
  const action = 'withdraw-earn'
  const isPositionStaked = args.position.stakedNftId !== null
  const isWithdrawing = args.quoteAmount.gt(ZERO)
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

  if (isPositionStaked && isWithdrawing && isAdjusting) {
    // withdrawAndMoveQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawAndMoveQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
      args.position.stakedNftId,
    ])
    targetPosition = args.position.withdraw(args.quoteAmount).moveQuote(priceToIndex)
  }

  if (isPositionStaked && !isWithdrawing && isAdjusting) {
    // moveQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuoteNft', [
      args.poolAddress,
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
      args.position.stakedNftId,
    ])
    targetPosition = args.position.moveQuote(priceToIndex)
  }

  if (isPositionStaked && isWithdrawing && !isAdjusting) {
    // withdrawQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      indexToPrice.toString(),
      args.position.stakedNftId,
    ])
    targetPosition = args.position.withdraw(args.quoteAmount)
  }

  if (!isPositionStaked && isWithdrawing && isAdjusting) {
    // withdrawAndMoveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawAndMoveQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.withdraw(args.quoteAmount).moveQuote(priceToIndex)
  }

  if (!isPositionStaked && !isWithdrawing && isAdjusting) {
    // moveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuote', [
      args.poolAddress,
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.moveQuote(priceToIndex)
  }

  if (!isPositionStaked && isWithdrawing && !isAdjusting) {
    // withdrawQuote
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.withdraw(args.quoteAmount)
  }

  if (!data || !targetPosition) throw new Error('Invalid withdrawAndAdjust params')

  return getAjnaEarnActionOutput({
    targetPosition,
    data,
    dependencies,
    args,
    txValue: '0',
    action,
  })
}
