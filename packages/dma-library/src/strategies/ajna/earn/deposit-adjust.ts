/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import poolInfoAbi from '@abis/external/protocols/ajna/poolInfoUtils.json'
import { ZERO } from '@dma-common/constants'
import { getAjnaEarnActionOutput, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { AjnaCommonDependencies, AjnaEarnPosition, AjnaStrategy } from '@dma-library/types/ajna'
import { AjnaEarnPayload } from '@dma-library/types/ajna/ajna-dependencies'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import bucketPrices from './buckets.json'

export type AjnaDepositAndAdjustStrategy = (
  args: AjnaEarnPayload,
  dependencies: AjnaCommonDependencies,
) => Promise<AjnaStrategy<AjnaEarnPosition>>

export const depositAndAdjust: AjnaDepositAndAdjustStrategy = async (args, dependencies) => {
  const action = 'deposit-earn'
  const isLendingEth =
    args.position.pool.quoteToken.toLowerCase() === dependencies.WETH.toLowerCase()
  const isPositionStaked = args.position.stakedNftId !== null
  const isDepositing = args.quoteAmount.gt(ZERO)
  const isAdjusting = !args.price.eq(args.position.price) && args.position.price.gt(ZERO)
  const isReopening = args.position.price.isZero()
  const shouldStakeNft = args.isStakingNft

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

  const priceToIndex = await poolInfo
    .priceToIndex(args.price.shiftedBy(18).toString())
    .then((res: any) => res.toString())
    .then((res: string) => new BigNumber(res))

  const indexToPrice = new BigNumber(
    bucketPrices[(args.position.priceIndex ? args.position.priceIndex : priceToIndex).toNumber()],
  )

  let data = ''
  let targetPosition: AjnaEarnPosition | null = null

  if (isPositionStaked && isDepositing && isAdjusting && !isReopening) {
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

  if (isPositionStaked && !isDepositing && isAdjusting && !isReopening) {
    // moveQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuoteNft', [
      args.poolAddress,
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
      args.position.stakedNftId,
    ])
    targetPosition = args.position.moveQuote(priceToIndex)
  }

  if (isPositionStaked && isDepositing && !isAdjusting && !isReopening) {
    // supplyQuoteNft
    data = ajnaProxyActions.interface.encodeFunctionData('supplyQuoteNft', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      args.price.shiftedBy(18).toString(),
      args.position.stakedNftId,
    ])
    targetPosition = args.position.deposit(args.quoteAmount)
  }

  if (!isPositionStaked && isDepositing && isAdjusting && !isReopening) {
    // supplyAndMoveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('supplyAndMoveQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.moveQuote(priceToIndex).deposit(args.quoteAmount)
  }

  if (!isPositionStaked && !isDepositing && isAdjusting && !isReopening) {
    // moveQuote
    data = ajnaProxyActions.interface.encodeFunctionData('moveQuote', [
      args.poolAddress,
      indexToPrice.toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.moveQuote(priceToIndex)
  }

  if (!isPositionStaked && isDepositing && !isAdjusting && !isReopening) {
    // supplyQuote
    data = ajnaProxyActions.interface.encodeFunctionData('supplyQuote', [
      args.poolAddress,
      ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
      args.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.deposit(args.quoteAmount)
  }

  if (!isPositionStaked && isDepositing && isReopening) {
    // reopen position
    data = ajnaProxyActions.interface.encodeFunctionData(
      shouldStakeNft ? 'supplyQuoteMintNftAndStake' : 'supplyQuote',
      [
        args.poolAddress,
        ethers.utils.parseUnits(args.quoteAmount.toString(), args.quoteTokenPrecision).toString(),
        args.price.shiftedBy(18).toString(),
      ],
    )
    targetPosition = args.position.reopen(args.quoteAmount, priceToIndex)
  }

  if (!data || !targetPosition) throw new Error('Invalid depositAndAdjust params')

  return getAjnaEarnActionOutput({
    targetPosition,
    data,
    dependencies,
    args,
    txValue: resolveAjnaEthAction(isLendingEth, args.quoteAmount),
    action,
  })
}
