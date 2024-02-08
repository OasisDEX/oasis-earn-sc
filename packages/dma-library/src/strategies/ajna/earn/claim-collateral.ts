/* eslint-disable @typescript-eslint/no-non-null-assertion */
import ajnaProxyActionsAbi from '@abis/external/protocols/ajna/ajnaProxyActions.json'
import { getAjnaEarnActionOutput } from '@dma-library/protocols/ajna'
import { AjnaCommonDependencies, AjnaEarnPosition, SummerStrategy } from '@dma-library/types/ajna'
import { AjnaEarnPayload } from '@dma-library/types/ajna/ajna-dependencies'
import { ethers } from 'ethers'

export type AjnaClaimCollateralStrategy = (
  args: AjnaEarnPayload,
  dependencies: AjnaCommonDependencies,
) => Promise<SummerStrategy<AjnaEarnPosition>>

export const claimCollateral: AjnaClaimCollateralStrategy = async (args, dependencies) => {
  const action = 'claim-earn'

  const ajnaProxyActions = new ethers.Contract(
    dependencies.ajnaProxyActions,
    ajnaProxyActionsAbi,
    dependencies.provider,
  )

  // claim all
  const data = ajnaProxyActions.interface.encodeFunctionData('removeCollateral', [
    args.poolAddress,
    args.position.price.shiftedBy(18).toString(),
  ])
  const targetPosition = args.position.claimCollateral()

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
