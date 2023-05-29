import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { prepareAjnaPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { AjnaPosition, Strategy } from '@dma-library/types'
import { views } from '@dma-library/views'
import { GetPoolData } from '@dma-library/views/ajna'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

interface AjnaCloseArgs {
  poolAddress: Address
  dpmProxyAddress: Address
  collateralPrice: BigNumber
  quotePrice: BigNumber
  quoteTokenPrecision: number
  collateralTokenPrecision: number
  position: AjnaPosition
}

interface AjnaAdjustDependencies {
  poolInfoAddress: Address
  ajnaProxyActions: Address
  provider: ethers.providers.Provider
  WETH: Address
  getPoolData: GetPoolData
  getPosition?: typeof views.ajna.getPosition
}

export type AjnaCloseStrategy = (
  args: AjnaCloseArgs,
  dependencies: AjnaAdjustDependencies,
) => Promise<Strategy<AjnaPosition>>

export const closeMultiply: AjnaCloseStrategy = async (args, dependencies) => {
  const isDepositingEth =
    args.position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const targetPosition = args.position.close()

  return prepareAjnaPayload({
    dependencies,
    targetPosition,
    data: '',
    errors: [],
    warnings: [],
    // TODO instead of zero we will need data from swap
    txValue: resolveAjnaEthAction(isDepositingEth, ZERO),
  })
}
