import UNISWAP_ROUTER_V3_ABI from '@abis/external/swap/IUniswapRouter.json'
import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'
import { RuntimeConfig } from '@dma-common/types/common'
import { Optional } from '@dma-common/types/optional'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

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
  network: Network = Network.MAINNET,
) {
  // TODO: Hacky fix. Should pass addresses as params
  if (network !== Network.MAINNET && network !== Network.OPTIMISM) {
    throw new Error('Unsupported network')
  }

  const WETHByNetwork = {
    [Network.MAINNET]: ADDRESSES[Network.MAINNET].common.WETH,
    [Network.OPTIMISM]: ADDRESSES[Network.OPTIMISM].common.WETH,
  }

  const RouterByNetwork = {
    [Network.MAINNET]: ADDRESSES[Network.MAINNET].common.UniswapRouterV3,
    [Network.OPTIMISM]: ADDRESSES[Network.OPTIMISM].common.UniswapRouterV3,
  }

  const value =
    tokenIn === WETHByNetwork[network] || tokenIn === WETHByNetwork[network] ? amountIn : 0
  const ethers = hre ? hre.ethers : (await import('hardhat')).ethers

  const uniswapV3 = new ethers.Contract(
    RouterByNetwork[network],
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
