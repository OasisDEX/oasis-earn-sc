/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import poolInfoAbi from '@abis/external/protocols/ajna/poolInfoUtils.json'
import { ZERO } from '@dma-common/constants'
import { AjnaEarnArgs, getAjnaEarnActionOutput } from '@dma-library/protocols/ajna'
import { AjnaEarnPosition } from '@dma-library/types/ajna'
import { AjnaDependencies, Strategy } from '@dma-library/types/common'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import bucketPrices from './buckets.json'

export type AjnaWithdrawAndAdjustStrategy = (
  args: AjnaEarnArgs,
  dependencies: AjnaDependencies,
) => Promise<Strategy<AjnaEarnPosition>>

export const withdrawAndAdjust: AjnaWithdrawAndAdjustStrategy = async (args, dependencies) => {
  const action = 'withdraw-earn'
  const isPositionStaked = args.position.stakedNftId !== null
  const isWithdrawing = args.quoteAmount.gt(ZERO)
  const isAdjusting = !args.price.eq(args.position.price)
  const isWithdrawingAll = args.position.quoteTokenAmount.lte(args.quoteAmount)

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

  if (isPositionStaked && isWithdrawing && isAdjusting && !isWithdrawingAll) {
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

  if (isPositionStaked && !isWithdrawing && isAdjusting && !isWithdrawingAll) {
    // moveQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuoteNft', [
      args.poolAddress,
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
      args.position.stakedNftId,
    ])
    targetPosition = args.position.moveQuote(priceToIndex)
  }

  if (isPositionStaked && isWithdrawing && !isAdjusting && !isWithdrawingAll) {
    // withdrawQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      indexToPrice.toString(),
      args.position.stakedNftId,
    ])
    targetPosition = args.position.withdraw(args.quoteAmount)
  }

  if (!isPositionStaked && isWithdrawing && isAdjusting && !isWithdrawingAll) {
    // withdrawAndMoveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawAndMoveQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.withdraw(args.quoteAmount).moveQuote(priceToIndex)
  }

  if (!isPositionStaked && !isWithdrawing && isAdjusting && !isWithdrawingAll) {
    // moveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuote', [
      args.poolAddress,
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.moveQuote(priceToIndex)
  }

  if (!isPositionStaked && isWithdrawing && !isAdjusting && !isWithdrawingAll) {
    // withdrawQuote
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.withdraw(args.quoteAmount)
  }

  if (!isPositionStaked && isWithdrawingAll) {
    // withdraw all without nft
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawQuote', [
      args.poolAddress,
      ethers.constants.MaxUint256,
      args.position.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.close()
  }

  if (isPositionStaked && isWithdrawingAll) {
    // withdraw all with nft
    data = ajnaProxyActions.interface.encodeFunctionData('unstakeNftAndWithdrawQuote', [
      args.poolAddress,
      indexToPrice.toString(),
      args.position.stakedNftId,
    ])
    targetPosition = args.position.close()
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
