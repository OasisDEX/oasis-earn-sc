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

/**
 * Retrieves the ERC4626 position based on the provided arguments and dependencies.
 *
 * @param {Erc4626Args} args - The arguments required to fetch the ERC4626 position.
 * @param {Erc4646ViewDependencies} dependencies - The dependencies required to fetch the ERC4626 position.
 * @returns {Promise<Erc4626Position>} - A promise that resolves to the ERC4626 position.
 */
export async function getErc4626Position(
  { proxyAddress, vaultAddress, quotePrice, user, underlyingAsset }: Erc4626Args,
  { provider, getLazyVaultSubgraphResponse, getVaultApyParameters }: Erc4646ViewDependencies,
): Promise<Erc4626Position> {
  const { precision } = underlyingAsset

  const vaultContractInstance = new ethers.Contract(vaultAddress, erc4626abi, provider) as IERC4626
  const [vaultParameters, subgraphResponse] = await Promise.all([
    getVaultApyParameters(vaultAddress),
    getLazyVaultSubgraphResponse(vaultAddress, proxyAddress),
  ])

  const positionParameters = subgraphResponse.positions[0]
  const vaultParametersFromSubgraph = subgraphResponse.vaults[0]
  const [balance, maxWithdraw, maxDeposit] = await Promise.all([
    vaultContractInstance.balanceOf(proxyAddress),
    vaultContractInstance.maxWithdraw(proxyAddress),
    vaultContractInstance.maxDeposit(proxyAddress),
  ])
  const assets = await vaultContractInstance.convertToAssets(balance)
  const quoteTokenAmount = new BigNumber(ethers.utils.formatUnits(assets, precision).toString())
  const maxWithdrawalAmount = new BigNumber(
    ethers.utils.formatUnits(maxWithdraw, precision).toString(),
  )
  const maxDepositAmount = new BigNumber(ethers.utils.formatUnits(maxDeposit, precision).toString())

  const vault = {
    address: vaultAddress,
    quoteToken: underlyingAsset.address,
  }
  const netValue = quoteTokenAmount

  const totalEarnings = {
    withFees: netValue
      .minus(
        new BigNumber(positionParameters.earnCumulativeDepositInQuoteToken).minus(
          new BigNumber(positionParameters.earnCumulativeWithdrawInQuoteToken),
        ),
      )
      .minus(new BigNumber(positionParameters.earnCumulativeFeesInQuoteToken)),
    withoutFees: netValue.minus(
      new BigNumber(positionParameters.earnCumulativeDepositInQuoteToken).minus(
        new BigNumber(positionParameters.earnCumulativeWithdrawInQuoteToken),
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
    ethers.utils.formatUnits(vaultParametersFromSubgraph.totalAssets, precision).toString(),
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
    getHistoricalApys(subgraphResponse),
    vault,
    user,
    quoteTokenAmount,
    quotePrice,
    netValue,
    pnl,
    totalEarnings,
    maxWithdrawalAmount,
    maxDepositAmount,
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
function getHistoricalApys(subgraphResponse: Erc4626SubgraphRepsonse) {
  const historicalApy = {
    previousDayAverage: new BigNumber(0),
    sevenDayAverage: new BigNumber(0),
    thirtyDayAverage: new BigNumber(0),
  }
  const previousDayAverage = subgraphResponse.vaults[0].interestRates[0]
  const sevenDayRates = subgraphResponse.vaults[0].interestRates.slice(0, 7)
  const thirtyDayRates = subgraphResponse.vaults[0].interestRates.slice(0, 30)

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
  if (subgraphResponse.vaults[0].interestRates.length > 0) {
    historicalApy.previousDayAverage = new BigNumber(previousDayAverage.rate)
  }

  return historicalApy
}
