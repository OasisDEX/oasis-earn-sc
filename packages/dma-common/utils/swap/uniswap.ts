import UNISWAP_ROUTER_V3_ABI from '@oasisdex/abis/external/swap/IUniswapRouter.json'
import { ADDRESSES } from '@oasisdex/addresses'
import { Network } from '@oasisdex/dma-deployments/types/network'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { Optional } from 'utility-types'

import { RuntimeConfig } from '../../types/common'

/**
 * tokenIn: string - asset address
 * tokenOut: string - asset address
 * amountIn: BigNumber - already formatted to wei
 * amountOutMinimum: BigNumber - already fromatted to wei. The least amount to receive.
 * recipient: string - wallet's addrees that's going to receive the funds
 */
export async function swapUniswapTokens(
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  amountOutMinimum: string,
  recipient: string,
  { provider, signer }: Optional<Pick<RuntimeConfig, 'provider' | 'signer' | 'address'>, 'address'>,
  hre?: HardhatRuntimeEnvironment,
) {
  const value =
    tokenIn === ADDRESSES[Network.MAINNET].common.WETH ||
    tokenIn === ADDRESSES[Network.OPTIMISM].common.WETH
      ? amountIn
      : 0
  const ethers = hre ? hre.ethers : (await import('hardhat')).ethers

  const uniswapV3 = new ethers.Contract(
    ADDRESSES[Network.MAINNET].common.UniswapRouterV3,
    UNISWAP_ROUTER_V3_ABI,
    provider,
  ).connect(signer)

  const swapParams = {
    tokenIn,
    tokenOut,
    fee: 3000,
    recipient,
    deadline: new Date().getTime(),
    amountIn,
    amountOutMinimum,
    sqrtPriceLimitX96: 0,
  }

  const uniswapTx = await uniswapV3.exactInputSingle(swapParams, { value, gasLimit: 3000000 })
  await uniswapTx.wait()
}
