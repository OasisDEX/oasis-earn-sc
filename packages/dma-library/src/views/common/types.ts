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
export enum FeeType {
  CURATOR = 'curator',
  PERFORMANCE = 'performance',
}
export enum AllocationType {
  LENDING = 'lending',
  LP = 'lp',
  STAKING = 'staking',
  OTHER = 'other',
}

export enum AllocationInfoValueType {
  LTV = 'ltv',
  COLL_RATIO = 'coll-ratio',
  APY = 'apy',
}
export type AllocationAdditionalInfoType = {
  valueType: AllocationInfoValueType
  value: string
}
/**
 * Represents an ERC4626 position.
 */
export interface IErc4626Position extends SupplyPosition {
  vault: Erc4626Vault
  netValue: BigNumber
  pnl: {
    withFees: BigNumber
    withoutFees: BigNumber
  }
  totalEarnings: {
    withFees: BigNumber
    withoutFees: BigNumber
  }
  apy: {
    per1d: BigNumber
    per7d: BigNumber
    per30d: BigNumber
    per90d: BigNumber
    per365d: BigNumber
  }
  maxWithdrawal: BigNumber
  allocations?: {
    type: AllocationType
    amount: BigNumber
    additionalInfo: AllocationAdditionalInfoType[]
  }[]
  rewardsWithPrice?: {
    token: string
    apyPer1d: BigNumber
    apyPer7d: BigNumber
    apyPer30d: BigNumber
    apyPer90d: BigNumber
    apyPer365d: BigNumber
  }[]
  rewardsWithoutPrice?: {
    token: string
    amountPer1d: BigNumber
    amountPer7d: BigNumber
    amountPer30d: BigNumber
    amountPer90d: BigNumber
    amountPer365d: BigNumber
  }[]
  fee?: {
    curator: string
    type: FeeType
    amount: BigNumber
  }
  /**
   * Simulates the deposit of the specified quote token amount into the ERC4626 position.
   * @param quoteTokenAmount The amount of quote token to deposit.
   * @returns The updated ERC4626 position.
   */
  deposit(quoteTokenAmount: BigNumber): Erc4626Position

  /**
   * Simulates the withdrawal the specified quote token amount from the ERC4626 position.
   * @param quoteTokenAmount The amount of quote token to withdraw.
   * @returns The updated ERC4626 position.
   */
  withdraw(quoteTokenAmount: BigNumber): Erc4626Position

  /**
   * Simulates closing of the ERC4626 position.
   * @returns The closed ERC4626 position.
   */
  close(): Erc4626Position
}

interface Erc4626Vault {
  address: string
  quoteToken: string
}

export class Erc4626Position implements IErc4626Position {
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
    public maxWithdrawal: BigNumber,
    public allocations?: {
      type: AllocationType
      amount: BigNumber
      additionalInfo: AllocationAdditionalInfoType[]
    }[],
    public rewardsWithPrice?: {
      token: string
      apyPer1d: BigNumber
      apyPer7d: BigNumber
      apyPer30d: BigNumber
      apyPer90d: BigNumber
      apyPer365d: BigNumber
    }[],
    public rewardsWithoutPrice?: {
      token: string
      amountPer1d: BigNumber
      amountPer7d: BigNumber
      amountPer30d: BigNumber
      amountPer90d: BigNumber
      amountPer365d: BigNumber
    }[],
    public fee?: {
      curator: string
      type: FeeType
      amount: BigNumber
    },
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
      this.maxWithdrawal,
      this.allocations,
      this.rewardsWithPrice,
      this.rewardsWithoutPrice,
      this.fee,
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
      this.maxWithdrawal,
      this.allocations,
      this.rewardsWithPrice,
      this.rewardsWithoutPrice,
      this.fee,
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
      this.maxWithdrawal,
      this.allocations,
      this.rewardsWithPrice,
      this.rewardsWithoutPrice,
      this.fee,
    )
  }
}

export type Erc4626Actions = 'open-earn' | 'deposit-earn' | 'withdraw-earn' | 'claim-earn'
