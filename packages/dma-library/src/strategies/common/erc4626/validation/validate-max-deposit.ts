import { formatCryptoBalance } from '@dma-common/utils/common'
import { Erc4626Position } from '@dma-library/types'
import { Erc4626StrategyError } from '@dma-library/types/common/erc4626-validation'
import { BigNumber } from 'bignumber.js'

export function validateMaxDeposit(
  depositAmount: BigNumber,
  position: Erc4626Position,
): Erc4626StrategyError[] {
  const maxDeposit = position.maxDeposit

  if (depositAmount.gt(maxDeposit)) {
    return [
      {
        name: 'deposit-more-than-possible',
        data: {
          amount: formatCryptoBalance(maxDeposit),
        },
      },
    ]
  }

  return []
}
