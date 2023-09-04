import { ZERO } from '@dma-common/constants'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import {
  IViewPositionParams,
  WithDebtChange,
  WithViewPositionDependencies,
} from '@dma-library/types'
import { AaveLikePosition, AaveLikeTokens } from '@dma-library/types/aave-like'
import { views } from '@dma-library/views'

export type AaveV2ChangeDebt = (
  args: IViewPositionParams<AaveLikeTokens> & WithDebtChange<AaveLikeTokens>,
  { addresses, provider }: WithViewPositionDependencies<AaveLikeStrategyAddresses>,
) => Promise<AaveLikePosition>

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
