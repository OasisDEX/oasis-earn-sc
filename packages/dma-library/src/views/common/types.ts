import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

export interface SupplyPosition {
  owner: Address
  quoteTokenAmount: BigNumber
  marketPrice: BigNumber

  apy: {
    per1d: BigNumber | undefined
    per7d: BigNumber | undefined
    per30d: BigNumber | undefined
    per90d: BigNumber | undefined
    per365d: BigNumber | undefined
  }

  deposit(amount: BigNumber): SupplyPosition
  withdraw(amount: BigNumber): SupplyPosition
  close(): SupplyPosition
}

interface Erc4626Vault {
  address: string
  quoteToken: string
}

export class Erc4626Position implements SupplyPosition {
  public earlyWithdrawPenalty: BigNumber = new BigNumber(23)

  constructor(
    public vault: Erc4626Vault,
    public owner: Address,
    public quoteTokenAmount: BigNumber,
    public marketPrice: BigNumber,
    public netValue: BigNumber,
    public pnl: {
      withFees: BigNumber
      withoutFees: BigNumber
    },
    public totalEarnings: { withFees: BigNumber; withoutFees: BigNumber },
  ) {}

  get apy() {
    return {
      per1d: this.getApyPerDays({ days: 1 }),
      per7d: this.getApyPerDays({ days: 7 }),
      per30d: this.getApyPerDays({ days: 30 }),
      per90d: this.getApyPerDays({ days: 90 }),
      per365d: this.getApyPerDays({ days: 365 }),
    }
  }

  getApyPerDays({ days }: { days: number }) {
    // TODO: implement
    return new BigNumber(0.1).times(days)
  }

  deposit(quoteTokenAmount: BigNumber) {
    return new Erc4626Position(
      this.vault,
      this.owner,
      this.quoteTokenAmount.plus(quoteTokenAmount),
      this.marketPrice,
      this.netValue,
      this.pnl,
      this.totalEarnings,
    )
  }

  withdraw(quoteTokenAmount: BigNumber) {
    return new Erc4626Position(
      this.vault,
      this.owner,
      this.quoteTokenAmount.minus(quoteTokenAmount),
      this.marketPrice,
      this.netValue,
      this.pnl,
      this.totalEarnings,
    )
  }

  close() {
    return new Erc4626Position(
      this.vault,
      this.owner,
      ZERO,
      this.marketPrice,
      this.netValue,
      this.pnl,
      this.totalEarnings,
    )
  }
}

export type Erc4626Actions = 'open-earn' | 'deposit-earn' | 'withdraw-earn' | 'claim-earn'
