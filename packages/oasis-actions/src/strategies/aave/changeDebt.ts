import { ZERO } from '../../helpers/constants'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { IViewPositionDependencies, IViewPositionParams, WithDebtChange } from '../../types'
import { AavePosition, AAVETokens } from '../../types/aave'
import { getCurrentPosition } from './getCurrentPosition'

export async function changeDebt(
  args: IViewPositionParams<AAVETokens> & WithDebtChange<AAVETokens>,
  { addresses, provider }: IViewPositionDependencies<AAVEStrategyAddresses>,
): Promise<AavePosition> {
  const currentPosition = await getCurrentPosition(args, { addresses, provider })

  if (currentPosition.debt.amount.gt(ZERO)) {
    throw new Error('Debt must be zero to change debt')
  }

  return await getCurrentPosition(
    { ...args, debtToken: args.newDebtToken },
    { addresses, provider },
  )
}
