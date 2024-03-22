import { Erc4626DepositStrategy, Erc4626WithdrawStrategy } from '@dma-library/types'

import { deposit } from './erc4626/deposit'
import { withdraw } from './erc4626/withdraw'
import type { MigrationStrategy } from './migrate'
import { migrate } from './migrate'

export { getSwapDataForCloseToCollateral } from './close-to-coll-swap-data'
export { getSwapDataForCloseToDebt } from './close-to-debt-swap-data'
export { getGenericSwapData } from './generic-swap-data'

export const common: {
  erc4626: {
    deposit: Erc4626DepositStrategy
    withdraw: Erc4626WithdrawStrategy
  }
  migrate: MigrationStrategy
} = {
  erc4626: {
    deposit,
    withdraw,
  },
  migrate: migrate,
}
