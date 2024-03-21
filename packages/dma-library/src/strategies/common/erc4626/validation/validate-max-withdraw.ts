import { formatCryptoBalance } from '@dma-common/utils/common'
import { Erc4626Position } from '@dma-library/types'
import { Erc4626StrategyError } from '@dma-library/types/common/erc4626-validation'
import { BigNumber } from 'bignumber.js'

export function validateMaxWithdraw(
  withdrawAmount: BigNumber,
  position: Erc4626Position,
): Erc4626StrategyError[] {
  const maxWithdraw = position.maxWithdrawal

  if (withdrawAmount.gt(maxWithdraw)) {
    return [
      {
        name: 'withdraw-more-than-available',
        data: {
          amount: formatCryptoBalance(maxWithdraw),
        },
      },
    ]
  }

  return []
}
