import { Network } from '@helpers/network'
import { AAVETokens, ONE } from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { swapUniswapTokens } from '../../helpers/swap/uniswap'
import {
  addressesByNetwork,
  isMainnetByNetwork,
  isOptimismByNetwork,
  NetworkAddressesForTests,
} from '../../test/test-utils/addresses'
import { RuntimeConfig } from '../types/common'

export type AAVETokensToGet = Exclude<AAVETokens, 'ETH' | 'WETH'>

export function buildGetTokenFunction(
  config: RuntimeConfig,
  hre: HardhatRuntimeEnvironment,
  network: Network.MAINNET | Network.OPT_MAINNET,
  wethAddress: string,
): (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean> {
  return async function getTokens(symbol: AAVETokensToGet, amount: BigNumber): Promise<boolean> {
    /* Ensures we always have enough tokens to open a position */
    const BUFFER_FACTOR = 1.1
    const amountInInWeth = amount.times(BUFFER_FACTOR).toFixed(0)

    let addresses: NetworkAddressesForTests | undefined
    if (isMainnetByNetwork(network)) {
      addresses = addressesByNetwork(Network.MAINNET)
    }
    if (isOptimismByNetwork(network)) {
      addresses = addressesByNetwork(Network.OPT_MAINNET)
    }

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
