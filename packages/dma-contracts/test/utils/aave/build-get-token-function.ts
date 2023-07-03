import { Network } from '@deploy-configurations/types/network'
import { ONE } from '@dma-common/constants'
import { addressesByNetwork, swapUniswapTokens } from '@dma-common/test-utils'
import { RuntimeConfig } from '@dma-common/types/common'
import { DeploymentSystem } from '@dma-contracts/scripts/deployment/deploy'
import { AAVETokens } from '@dma-library'
import BigNumber from 'bignumber.js'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export type AAVETokensToGet = Exclude<AAVETokens, 'ETH' | 'WETH' | 'CBETH' | 'RETH' | 'DAI'>

export function buildGetTokenFunctionByStorage(
  ds: DeploymentSystem,
  network: Network,
): (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean> {
  return async function getTokens(symbol: AAVETokensToGet, amount: BigNumber): Promise<boolean> {
    const addresses = addressesByNetwork(network)

    if (!addresses) throw new Error('addresses is undefined')
    if (!ds.signerAddress) throw new Error('DS user address is undefined')

    try {
      const tokens: Record<AAVETokensToGet, string> = {
        STETH: addresses.STETH,
        WBTC: addresses.WBTC,
        USDC: addresses.USDC,
        WSTETH: addresses.WSTETH,
      }

      const tokenAddress = tokens[symbol]
      const user = ds.signerAddress
      await ds.setTokenBalance(user, tokenAddress, amount)
    } catch (e: any) {
      console.log(`Error ${e}`)
    }
    return true
  }
}

export function buildGetTokenFunction(
  config: RuntimeConfig,
  hre: HardhatRuntimeEnvironment,
  network: Network.MAINNET | Network.OPTIMISM,
  wethAddress: string,
): (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean> {
  return async function getTokens(symbol: AAVETokensToGet, amount: BigNumber): Promise<boolean> {
    /* Ensures we always have enough tokens to open a position */
    const BUFFER_FACTOR = 1.1
    const amountInInWeth = amount.times(BUFFER_FACTOR).toFixed(0)

    const addresses = addressesByNetwork(network)

    if (!addresses) throw new Error('addresses is undefined')

    try {
      const tokens: Record<AAVETokensToGet, string> = {
        STETH: addresses.STETH,
        WBTC: addresses.WBTC,
        USDC: addresses.USDC,
        WSTETH: addresses.WSTETH,
      }

      const tokenAddress = tokens[symbol]

      await swapUniswapTokens(
        wethAddress,
        tokenAddress,
        amountInInWeth,
        ONE.toFixed(0),
        config.address,
        config,
        hre,
      )
    } catch (e: any) {
      console.log(`Error while swapping ${amountInInWeth} WETH for ${symbol}: ${e.message}`)
    }

    return true
  }
}
