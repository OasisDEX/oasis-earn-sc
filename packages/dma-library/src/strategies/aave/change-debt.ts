import { ZERO } from '@dma-common/constants'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { IViewPositionDependencies, IViewPositionParams, WithDebtChange } from '@dma-library/types'
import { AavePosition, AAVETokens } from '@dma-library/types/aave'

import { AaveVersion, getCurrentPosition } from './get-current-position'

export async function changeDebt(
  args: IViewPositionParams<AAVETokens> & WithDebtChange<AAVETokens>,
  { addresses, provider }: IViewPositionDependencies<AAVEStrategyAddresses>,
): Promise<AavePosition> {
  const currentPosition = await getCurrentPosition(args, {
    addresses,
    provider,
    protocolVersion: AaveVersion.v2,
  })

  if (currentPosition.debt.amount.gt(ZERO)) {
    throw new Error('Debt must be zero to change debt')
  }

  return await getCurrentPosition(
    { ...args, debtToken: args.newDebtToken },
    { addresses, provider, protocolVersion: AaveVersion.v2 },
  )
}
