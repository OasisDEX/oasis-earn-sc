import { deposit, Erc4626DepositStrategy } from './erc4626/deposit'
import { Erc4626WithdrawStrategy, withdraw } from './erc4626/withdraw'

export { getSwapDataForCloseToCollateral } from './close-to-coll-swap-data'
export { getSwapDataForCloseToDebt } from './close-to-debt-swap-data'
export { getGenericSwapData } from './generic-swap-data'

export const common: {
  erc4626: {
    deposit: Erc4626DepositStrategy
    withdraw: Erc4626WithdrawStrategy
  }
} = {
  erc4626: {
    deposit,
    withdraw,
  },
}
