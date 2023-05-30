/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import { getAjnaEarnActionOutput } from '@dma-library/protocols/ajna'
import { AjnaCommonDependencies, AjnaEarnPosition, Strategy } from '@dma-library/types/ajna'
import { AjnaEarnPayload } from '@dma-library/types/ajna/ajna-dependencies'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import bucketPrices from './buckets.json'

export type AjnaClaimCollateralStrategy = (
  args: AjnaEarnPayload,
  dependencies: AjnaCommonDependencies,
) => Promise<Strategy<AjnaEarnPosition>>

export const claimCollateral: AjnaClaimCollateralStrategy = async (args, dependencies) => {
  const action = 'claim-earn'
  const isPositionStaked = args.position.stakedNftId !== null

  const ajnaProxyActions = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  const indexToPrice = new BigNumber(bucketPrices[args.position.priceIndex!.toNumber()])

  let data = ''
  let targetPosition: AjnaEarnPosition | null = null

  if (!isPositionStaked) {
    // claim all without nft
    data = ajnaProxyActions.interface.encodeFunctionData('removeCollateral', [
      args.poolAddress,
      args.position.price.shiftedBy(18).toString(),
    ])
    targetPosition = args.position.claimCollateral()
  }

  if (isPositionStaked) {
    // claim all with nft
    data = ajnaProxyActions.interface.encodeFunctionData('unstakeNftAndClaimCollateral', [
      args.poolAddress,
      indexToPrice.toString(),
      args.position.stakedNftId,
    ])
    targetPosition = args.position.claimCollateral()
  }

  if (!data || !targetPosition) throw new Error('Invalid claimCollateral params')

  return getAjnaEarnActionOutput({
    targetPosition,
    data,
    dependencies,
    args,
    txValue: '0',
    action,
  })
}
