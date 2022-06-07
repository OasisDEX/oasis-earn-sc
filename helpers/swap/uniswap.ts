import '@nomiclabs/hardhat-ethers'
import { ethers } from 'hardhat'
import { ADDRESSES } from '../addresses'
import UNISWAP_ROUTER_V3_ABI from '../../abi/IUniswapRouter.json'
import { OneInchSwapResponse, RuntimeConfig } from '../types'
import { exchangeTokens, formatOneInchSwapUrl } from './1inch'

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
  { provider, signer }: RuntimeConfig,
) {
  const value = tokenIn === ADDRESSES.main.WETH ? amountIn : 0

  const UNISWAP_ROUTER_V3 = '0xe592427a0aece92de3edee1f18e0157c05861564'

  const uniswapV3 = new ethers.Contract(UNISWAP_ROUTER_V3, UNISWAP_ROUTER_V3_ABI, provider).connect(
    signer,
  )

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

export async function swapOneInchTokens(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  recepient: string,
  slippage: string,
  protocols: string[] = [],
): Promise<OneInchSwapResponse> {
  const url = formatOneInchSwapUrl(
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippage,
    recepient,
    protocols,
  )

  return exchangeTokens(url)
}
