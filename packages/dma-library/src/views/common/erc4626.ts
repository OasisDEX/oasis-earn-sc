import { RISK_RATIO_CTOR_TYPE, RiskRatio } from '@domain/risk-ratio'
import { IERC4626 } from '@typechain/index'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import erc4626abi from '../../../../abis/external/tokens/IERC4626.json'
import { Erc4626Position, FeeType } from './types'

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

type SubgraphRepsonse = {
  id: string
  shares: string
  earnCumulativeFeesUSD: string
  earnCumulativeDepositUSD: string
  earnCumulativeWithdrawUSD: string
  earnCumulativeFeesInQuoteToken: string
  earnCumulativeDepositInQuoteToken: string
  earnCumulativeWithdrawInQuoteToken: string
  vault: {
    totalAssets: string
    totalShares: string
  }
}

export type Erc4646ViewDependencies = {
  provider: ethers.providers.Provider
  getVaultApyParameters: (vaultAddress: string) => Promise<VaultApyResponse>
  getLazyVaultSubgraphResponse: (
    vaultAddress: string,
    dpmAccount: string,
  ) => Promise<SubgraphRepsonse>
}
type Token = {
  address: string
  precision: number
  symbol?: string
}
export type Erc4626Args = {
  proxyAddress: string
  user: string
  vaultAddress: string
  underlyingAsset: Token
  quotePrice: BigNumber
}

export async function getErc4626Position(
  { proxyAddress, vaultAddress, quotePrice, user, underlyingAsset }: Erc4626Args,
  { provider, getLazyVaultSubgraphResponse, getVaultApyParameters }: Erc4646ViewDependencies,
): Promise<Erc4626Position> {
  const vaultContractInstance = new ethers.Contract(vaultAddress, erc4626abi, provider) as IERC4626
  const vaultParameters = await getVaultApyParameters(vaultAddress)
  const positionParameters = await getLazyVaultSubgraphResponse(vaultAddress, proxyAddress)

  const { precision } = underlyingAsset

  let quoteTokenAmount = new BigNumber(0)

  await vaultContractInstance.balanceOf(proxyAddress).then(async (balance: ethers.BigNumber) => {
    await vaultContractInstance.convertToAssets(balance).then(async (assets: ethers.BigNumber) => {
      quoteTokenAmount = new BigNumber(ethers.utils.formatUnits(assets, precision).toString())
    })
  })

  const vault = {
    address: vaultAddress,
    quoteToken: underlyingAsset.address,
  }
  const netValue = quoteTokenAmount.multipliedBy(quotePrice)

  const totalEarnings = {
    withFees: netValue
      .minus(
        new BigNumber(positionParameters.earnCumulativeDepositUSD).minus(
          new BigNumber(positionParameters.earnCumulativeWithdrawUSD),
        ),
      )
      .minus(new BigNumber(positionParameters.earnCumulativeFeesUSD)),
    withoutFees: netValue.minus(
      new BigNumber(positionParameters.earnCumulativeDepositUSD).minus(
        new BigNumber(positionParameters.earnCumulativeWithdrawUSD),
      ),
    ),
  }

  const pnl = {
    withFees: totalEarnings.withFees.div(netValue),
    withoutFees: totalEarnings.withoutFees.div(netValue),
  }

  const annualizedApy = new BigNumber(vaultParameters.vault.apy)
  const annualizedApyFromRewards = vaultParameters.apyFromRewards
    ? vaultParameters.apyFromRewards.map(reward => {
        return {
          token: reward.token,
          value: new BigNumber(reward.value),
          per1kUsd: reward.per1kUsd ? new BigNumber(reward.per1kUsd) : undefined,
        }
      })
    : undefined

  const tvl = new BigNumber(
    ethers.utils.formatUnits(positionParameters.vault.totalAssets, precision).toString(),
  )
  const maxWithdrawal = await vaultContractInstance
    .maxWithdraw(proxyAddress)
    .then(async (maxWithdraw: ethers.BigNumber) => {
      return new BigNumber(ethers.utils.formatUnits(maxWithdraw, precision).toString())
    })

  const allocations = vaultParameters.allocations
    ? vaultParameters.allocations.map(allocation => {
        return {
          token: allocation.token,
          supply: new BigNumber(allocation.supply),
          riskRatio: new RiskRatio(new BigNumber(allocation.riskRatio), RISK_RATIO_CTOR_TYPE.LTV),
        }
      })
    : undefined

  const rewards = vaultParameters.rewards
    ? vaultParameters.rewards.map(reward => {
        return {
          token: reward.token,
          earned: new BigNumber(reward.earned),
          claimable: new BigNumber(reward.claimable),
        }
      })
    : undefined

  const fee = vaultParameters.vault.fee
    ? {
        curator: vaultParameters.vault.curator ? vaultParameters.vault.curator : '',
        type: FeeType.CURATOR,
        amount: new BigNumber(vaultParameters.vault.fee),
      }
    : undefined

  return new Erc4626Position(
    annualizedApy,
    annualizedApyFromRewards,
    vault,
    user,
    quoteTokenAmount,
    quotePrice,
    netValue,
    pnl,
    totalEarnings,
    maxWithdrawal,
    tvl,
    allocations,
    rewards,
    fee,
  )
}
