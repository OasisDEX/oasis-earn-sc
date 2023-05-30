import { ZERO } from '@dma-common/constants'
import { prepareAjnaPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { AjnaCommonDependencies, AjnaPosition, Strategy } from '@dma-library/types'
import { AjnaMultiplyPayload } from '@dma-library/types/ajna'

export type AjnaCloseStrategy = (
  args: AjnaMultiplyPayload,
  dependencies: AjnaCommonDependencies,
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
