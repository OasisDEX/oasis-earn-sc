export type Erc4626StrategyError = Erc4626MaxWithdrawalError | Erc4626MaxDepositError

export type Erc4626MaxWithdrawalError = {
  name: 'withdraw-more-than-available'
  data: {
    amount: string
  }
}

export type Erc4626MaxDepositError = {
  name: 'deposit-more-than-possible'
  data: {
    amount: string
  }
}
