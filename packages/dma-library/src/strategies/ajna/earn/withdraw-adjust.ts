/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import poolInfoAbi from '@abis/external/protocols/ajna/poolInfoUtils.json'
import { ZERO } from '@dma-common/constants'
import { getAjnaEarnActionOutput } from '@dma-library/protocols/ajna'
import { AjnaCommonDependencies, AjnaEarnPosition, SummerStrategy } from '@dma-library/types/ajna'
import { AjnaEarnPayload } from '@dma-library/types/ajna/ajna-dependencies'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import bucketPrices from './buckets.json'

export type AjnaWithdrawAndAdjustStrategy = (
  args: AjnaEarnPayload,
  dependencies: AjnaCommonDependencies,
) => Promise<SummerStrategy<AjnaEarnPosition>>

export const withdrawAndAdjust: AjnaWithdrawAndAdjustStrategy = async (args, dependencies) => {
  const action = 'withdraw-earn'
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

  if (isWithdrawing && isAdjusting && !isWithdrawingAll) {
    // withdrawAndMoveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawAndMoveQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.withdraw(args.quoteAmount).moveQuote(priceToIndex)
  }

  if (!isWithdrawing && isAdjusting && !isWithdrawingAll) {
    // moveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuote', [
      args.poolAddress,
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.moveQuote(priceToIndex)
  }

  if (isWithdrawing && !isAdjusting && !isWithdrawingAll) {
    // withdrawQuote
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.withdraw(args.quoteAmount)
  }

  if (isWithdrawingAll) {
    // withdraw all
    data = ajnaProxyActions.interface.encodeFunctionData('withdrawQuote', [
      args.poolAddress,
      ethers.constants.MaxUint256,
      args.position.price.shiftedBy(18).toString(),
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
