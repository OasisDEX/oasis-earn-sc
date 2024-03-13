import { RISK_RATIO_CTOR_TYPE, RiskRatio } from '@domain/risk-ratio'
import { IERC4626 } from '@typechain/index'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import erc4626abi from '../../../../abis/external/tokens/IERC4626.json'
import { Erc4626Position, FeeType } from './types'

type VaultApyResponse = {
  apy: string
  apyFromRewards: {
    token: string
    value: string
    per1kUsd?: string
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
    fee?: string
    curator?: string
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

  const annualizedApy = new BigNumber(vaultParameters.apy)
  const annualizedApyFromRewards = vaultParameters.apyFromRewards.map(reward => {
    return {
      token: reward.token,
      value: new BigNumber(reward.value),
      per1kUsd: reward.per1kUsd ? new BigNumber(reward.per1kUsd) : undefined,
    }
  })

  const tvl = new BigNumber(
    ethers.utils.formatUnits(positionParameters.vault.totalAssets, precision).toString(),
  )
  const maxWithdrawal = await vaultContractInstance
    .maxWithdraw(proxyAddress)
    .then(async (maxWithdraw: ethers.BigNumber) => {
      return new BigNumber(ethers.utils.formatUnits(maxWithdraw, precision).toString())
    })

  const allocations = [
    {
      token: underlyingAsset.address,
      supply: new BigNumber(0.1),
      riskRatio: new RiskRatio(new BigNumber(0.55), RISK_RATIO_CTOR_TYPE.LTV),
    },
  ]
  const rewards = [
    {
      token: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
      earned: new BigNumber(100),
      claimable: new BigNumber(0.1),
    },
    {
      token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      earned: new BigNumber(1000),
      claimable: new BigNumber(200),
    },
  ]
  let fee
  if (positionParameters.vault.fee) {
    fee = {
      curator: positionParameters.vault.curator,
      type: FeeType.CURATOR,
      amount: positionParameters.vault.fee,
    }
  }

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
