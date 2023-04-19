import { ADDRESSES } from '@oasisdex/addresses'
import { ONE } from '@oasisdex/dma-common/constants'
import { RuntimeConfig } from '@oasisdex/dma-common/types/common'
import { swapUniswapTokens } from '@oasisdex/dma-common/utils/swap'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { AAVETokens } from '@oasisdex/dma-library'
import BigNumber from 'bignumber.js'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { mainnetAddresses } from '../../addresses'

export type AAVETokensToGet = Exclude<AAVETokens, 'ETH' | 'WETH'>
const tokens: Record<AAVETokensToGet, string> = {
  STETH: mainnetAddresses.STETH,
  WBTC: mainnetAddresses.WBTC,
  USDC: mainnetAddresses.USDC,
  WSTETH: mainnetAddresses.WSTETH,
}

export function buildGetTokenFunction(
  config: RuntimeConfig,
  hre: HardhatRuntimeEnvironment,
): (symbol: AAVETokensToGet, amount: BigNumber) => Promise<boolean> {
  return async function getTokens(symbol: AAVETokensToGet, amount: BigNumber): Promise<boolean> {
    /* Ensures we always have enough tokens to open a position */
    const BUFFER_FACTOR = 1.1
    const amountInInWeth = amount.times(BUFFER_FACTOR).toFixed(0)
    try {
      const wethAddress = ADDRESSES[Network.MAINNET].common.WETH
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
