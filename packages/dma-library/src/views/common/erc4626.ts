import { RISK_RATIO_CTOR_TYPE, RiskRatio } from '@domain/risk-ratio'
import { IERC4626 } from '@typechain/index'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import erc4626abi from '../../../../abis/external/tokens/IERC4626.json'
import { Erc4626Position, FeeType } from '../../types/common'
import type {
  Erc4626Args,
  Erc4626SubgraphRepsonse,
  Erc4646ViewDependencies,
} from '../../types/common/erc4626-view'

export async function getErc4626Position(
  { proxyAddress, vaultAddress, quotePrice, user, underlyingAsset }: Erc4626Args,
  { provider, getLazyVaultSubgraphResponse, getVaultApyParameters }: Erc4646ViewDependencies,
): Promise<Erc4626Position> {
  const { precision } = underlyingAsset

  const vaultContractInstance = new ethers.Contract(vaultAddress, erc4626abi, provider) as IERC4626
  const [vaultParameters, positionParameters] = await Promise.all([
    getVaultApyParameters(vaultAddress),
    getLazyVaultSubgraphResponse(vaultAddress, proxyAddress),
  ])
  const [balance, maxWithdraw] = await Promise.all([
    vaultContractInstance.balanceOf(proxyAddress),
    vaultContractInstance.maxWithdraw(proxyAddress),
  ])
  const assets = await vaultContractInstance.convertToAssets(balance)
  const quoteTokenAmount = new BigNumber(ethers.utils.formatUnits(assets, precision).toString())
  const maxWithdrawal = new BigNumber(ethers.utils.formatUnits(maxWithdraw, precision).toString())

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
    getHistoricalApys(positionParameters),
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

/**
 * Calculates the historical APYs (Annual Percentage Yields) based on the given position parameters.
 * @param positionParameters - The position parameters containing the vault and interest rates.
 * @returns An object containing the historical APYs.
 */
function getHistoricalApys(positionParameters: Erc4626SubgraphRepsonse) {
  const historicalApy = {
    previousDayAverage: new BigNumber(0),
    sevenDayAverage: new BigNumber(0),
    thirtyDayAverage: new BigNumber(0),
  }
  const previousDayAverage = positionParameters.vault.interestRates[0]
  const sevenDayRates = positionParameters.vault.interestRates.slice(0, 7)
  const thirtyDayRates = positionParameters.vault.interestRates.slice(0, 30)

  if (sevenDayRates.length > 0) {
    historicalApy.sevenDayAverage = sevenDayRates
      .reduce((acc, rate) => {
        return acc.plus(new BigNumber(rate.rate))
      }, new BigNumber(0))
      .div(sevenDayRates.length)
  }

  if (thirtyDayRates.length > 0) {
    historicalApy.thirtyDayAverage = thirtyDayRates
      .reduce((acc, rate) => {
        return acc.plus(new BigNumber(rate.rate))
      }, new BigNumber(0))
      .div(thirtyDayRates.length)
  }
  if (positionParameters.vault.interestRates.length > 0) {
    historicalApy.previousDayAverage = new BigNumber(previousDayAverage.rate)
  }

  return historicalApy
}
