import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { RiskRatio } from '@domain/risk-ratio'
import BigNumber from 'bignumber.js'
import type { providers } from 'ethers'

import { SupplyPosition } from '../ajna/ajna-earn-position'

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

interface ApyFromRewards {
  token: string
  value: BigNumber
  per1kUsd?: BigNumber
}

type VaultApyResponse = {
  vault: {
    apy: string
    fee?: string
    curator?: string
  }
  apyFromRewards?: {
    token: string
    value: string
    per1kUsd?: string
  }[]
  rewards?: {
    token: string
    earned: string
    claimable: string
  }[]
  allocations?: {
    token: string
    supply: string
    riskRatio: string
  }[]
}

export type Erc4626SubgraphRepsonse = {
  positions: {
    earnCumulativeDepositInQuoteToken: string
    earnCumulativeDepositUSD: string
    earnCumulativeFeesInQuoteToken: string
    earnCumulativeFeesUSD: string
    earnCumulativeWithdrawInQuoteToken: string
    earnCumulativeWithdrawUSD: string
    id: string
    shares: string
  }[]
  vaults: {
    interestRates: {
      timestamp: string
      rate: string
    }[]
    totalAssets: string
    totalShares: string
  }[]
}

export type Erc4646ViewDependencies = {
  provider: providers.Provider
  getVaultApyParameters: (vaultAddress: string) => Promise<VaultApyResponse>
  getLazyVaultSubgraphResponse: (
    vaultAddress: string,
    dpmAccount: string,
  ) => Promise<Erc4626SubgraphRepsonse>
}

export type Erc4626Args = {
  proxyAddress: string
  user: string
  vaultAddress: string
  underlyingAsset: Token
  quotePrice: BigNumber
}
export type Token = {
  address: string
  precision: number
  symbol?: string
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
  apyFromRewards: {
    per1d: ApyFromRewards[]
    per7d: ApyFromRewards[]
    per30d: ApyFromRewards[]
    per90d: ApyFromRewards[]
    per365d: ApyFromRewards[]
  }
  historicalApy: {
    previousDayAverage: BigNumber
    sevenDayAverage: BigNumber
    thirtyDayAverage: BigNumber
  }
  tvl: BigNumber
  maxWithdrawal: BigNumber
  maxDeposit: BigNumber
  allocations?: {
    token: string
    supply: BigNumber
    riskRatio?: RiskRatio
  }[]
  rewards?: {
    token: string
    earned: BigNumber
    claimable: BigNumber
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
    public annualizedApy: BigNumber,
    public annualizedApyFromRewards:
      | {
          token: string
          value: BigNumber
          per1kUsd?: BigNumber
        }[]
      | undefined,
    public historicalApy: {
      previousDayAverage: BigNumber
      sevenDayAverage: BigNumber
      thirtyDayAverage: BigNumber
    },
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
    public maxDeposit: BigNumber,
    public tvl: BigNumber,
    public allocations?: {
      token: string
      supply: BigNumber
      riskRatio?: RiskRatio
    }[],
    public rewards?: {
      token: string
      earned: BigNumber
      claimable: BigNumber
    }[],
    public fee?: {
      curator: string
      type: FeeType
      amount: BigNumber
    },
  ) {}

  /**
   * Represents the Annual Percentage Yield (APY) from native vault yield.
   * @returns An object containing the APY for different time periods.
   */
  get apy() {
    return {
      per1d: this.getTotalApyForDays({ days: 1 }),
      per7d: this.getTotalApyForDays({ days: 7 }),
      per30d: this.getTotalApyForDays({ days: 30 }),
      per90d: this.getTotalApyForDays({ days: 90 }),
      per365d: this.getTotalApyForDays({ days: 365 }),
    }
  }

  /**
   * Calculates the annual percentage yield (APY) from additional rewards.
   * @returns An object containing the APY for different time periods.
   */
  get apyFromRewards() {
    return {
      per1d: this.getTotalApyFromRewardsForDays({ days: 1 }),
      per7d: this.getTotalApyFromRewardsForDays({ days: 7 }),
      per30d: this.getTotalApyFromRewardsForDays({ days: 30 }),
      per90d: this.getTotalApyFromRewardsForDays({ days: 90 }),
      per365d: this.getTotalApyFromRewardsForDays({ days: 365 }),
    }
  }

  /**
   * Calculates the total APY (Annual Percentage Yield) from rewards for a given number of days.
   *
   * @param  days - The number of days to calculate the APY for.
   * @returns  - An array of objects containing the token, value, and per1kUsd (optional) properties.
   */
  getTotalApyFromRewardsForDays({ days }: { days: number }) {
    return this.annualizedApyFromRewards
      ? this.annualizedApyFromRewards.map(reward => {
          return {
            token: reward.token,
            value: reward.value.div(365).times(days),
            per1kUsd: reward.per1kUsd ? reward.per1kUsd.div(365).times(days) : undefined,
          }
        })
      : []
  }

  /**
   * Calculates the total APY (Annual Percentage Yield) for a given number of days.
   *
   * @param {number} days - The number of days to calculate the total APY for.
   * @returns  - The total APY for the specified number of days.
   */
  getTotalApyForDays({ days }: { days: number }) {
    return this.annualizedApy.div(365).times(days)
  }

  deposit(quoteTokenAmount: BigNumber) {
    return new Erc4626Position(
      this.annualizedApy,
      this.annualizedApyFromRewards,
      this.historicalApy,
      this.vault,
      this.owner,
      this.quoteTokenAmount.plus(quoteTokenAmount),
      this.marketPrice,
      this.netValue,
      this.pnl,
      this.totalEarnings,
      this.maxWithdrawal.plus(quoteTokenAmount),
      this.maxDeposit.minus(quoteTokenAmount),
      this.tvl,
      this.allocations,
      this.rewards,
      this.fee,
    )
  }

  withdraw(quoteTokenAmount: BigNumber) {
    return new Erc4626Position(
      this.annualizedApy,
      this.annualizedApyFromRewards,
      this.historicalApy,
      this.vault,
      this.owner,
      this.quoteTokenAmount.minus(quoteTokenAmount),
      this.marketPrice,
      this.netValue,
      this.pnl,
      this.totalEarnings,
      this.maxWithdrawal.minus(quoteTokenAmount),
      this.maxDeposit.plus(quoteTokenAmount),
      this.tvl,
      this.allocations,
      this.rewards,
      this.fee,
    )
  }

  close() {
    return new Erc4626Position(
      this.annualizedApy,
      this.annualizedApyFromRewards,
      this.historicalApy,
      this.vault,
      this.owner,
      ZERO,
      this.marketPrice,
      this.netValue,
      this.pnl,
      this.totalEarnings,
      ZERO,
      this.maxDeposit,
      this.tvl,
      this.allocations,
      this.rewards,
      this.fee,
    )
  }
}
