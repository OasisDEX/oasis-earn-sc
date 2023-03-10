import { AAVETokens, ADDRESSES, ONE } from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { swapUniswapTokens } from '../../helpers/swap/uniswap'
import { mainnetAddresses } from '../../test/addresses'
import { RuntimeConfig } from '../types/common'

export type AAVETokensToGet = Exclude<AAVETokens, 'ETH' | 'WETH'>

export function buildGetTokenFunction(
  system: any
): (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean> {

  const tokens: Record<AAVETokensToGet, string> = {
    STETH: system.config.common.STETH.address,
    WBTC: system.config.common.WBTC.address,
    USDC: system.config.common.USDC.address,
    WSTETH: system.config.common.WSTETH.address,
  }

  return async function getTokens(symbol: AAVETokensToGet, amount: BigNumber): Promise<boolean> {
    /* Ensures we always have enough tokens to open a position */
    const BUFFER_FACTOR = 1.1
    const amountInInWeth = amount.times(BUFFER_FACTOR).toFixed(0)
    try {
      const wethAddress = ADDRESSES.main.WETH
      const tokenAddress = tokens[symbol]

      const config: RuntimeConfig = system.getRuntimeConfig()
      await swapUniswapTokens(
        wethAddress,
        tokenAddress,
        amountInInWeth,
        ONE.toFixed(0),
        config.address,
        system
      )
    } catch (e: any) {
      console.log(`Error while swapping ${amountInInWeth} WETH for ${symbol}: ${e.message}`)
    }

    return true
  }
}
