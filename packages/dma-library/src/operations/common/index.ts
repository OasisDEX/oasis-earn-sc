import { deposit as erc4626Deposit, Erc4626DepositOperation } from './erc4626/deposit'
import { Erc4626WithdrawOperation, withdraw as erc4626Withdraw } from './erc4626/withdraw'

export type Erc4626Operations = {
  deposit: Erc4626DepositOperation
  withdraw: Erc4626WithdrawOperation
}

export const erc4626Operations: Erc4626Operations = {
  deposit: erc4626Deposit,
  withdraw: erc4626Withdraw,
}
