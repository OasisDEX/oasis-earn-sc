import { ZERO } from '@dma-common/constants'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { IViewPositionDependencies, IViewPositionParams, WithDebtChange } from '@dma-library/types'
import { AavePosition, AAVETokens } from '@dma-library/types/aave'
import { views } from '@dma-library/views'

export type AaveV2ChangeDebt = (
  args: IViewPositionParams<AAVETokens> & WithDebtChange<AAVETokens>,
  { addresses, provider }: IViewPositionDependencies<AaveLikeStrategyAddresses>,
) => Promise<AavePosition>

export const changeDebt: AaveV2ChangeDebt = async (args, { addresses, provider }) => {
  const currentPosition = await views.aave.v2(args, {
    addresses,
    provider,
  })

  if (currentPosition.debt.amount.gt(ZERO)) {
    throw new Error('Debt must be zero to change debt')
  }

  return await views.aave.v2({ ...args, debtToken: args.newDebtToken }, { addresses, provider })
}
