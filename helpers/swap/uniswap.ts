import '@nomiclabs/hardhat-ethers'

import { ethers } from 'hardhat'

import UNISWAP_ROUTER_V3_ABI from '../../abi/IUniswapRouter.json'
import { ADDRESSES } from '../addresses'
import { RuntimeConfig } from '../types/common'
import { amountToWei } from '../utils'

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
  console.log('ADDRESSES.main.uniswapRouterV3', ADDRESSES.main.uniswapRouterV3)

  console.log('signer', signer)
  const uniswapV3 = new ethers.Contract(
    ADDRESSES.main.uniswapRouterV3,
    UNISWAP_ROUTER_V3_ABI,
    provider,
  ).connect(signer)

  const swapParams = {
    tokenIn: ADDRESSES.main.ETH,
    tokenOut: tokenOut,
    fee: 3000,
    recipient: recipient,
    deadline: 1751366148,
    amountIn: amountToWei(200).toFixed(0),
    amountOutMinimum: amountOutMinimum,
    sqrtPriceLimitX96: 0,
  }
  console.log('swapping..', swapParams)
  console.log('value..', amountToWei(200).toFixed(0))
  const uniswapTx = await uniswapV3.exactInputSingle(swapParams, {
    value: amountToWei(200).toFixed(0),
  })

  // const swapParams = {
  //   tokenIn,
  //   tokenOut,
  //   fee: 3000,
  //   recipient,
  //   // deadline: new Date().getTime(),
  //   deadline: 1751366148,
  //   amountIn,
  //   amountOutMinimum,
  //   sqrtPriceLimitX96: 0,
  // }
  // console.log('swapping..', swapParams)
  // console.log('value..', value)
  // const uniswapTx = await uniswapV3.exactInputSingle(swapParams, { value, gasLimit: 8000000 })
  await uniswapTx.wait()
  console.log('successful swap..')
}
