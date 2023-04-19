import { ADDRESSES } from '@oasisdex/addresses'
import { Network } from '@oasisdex/dma-deployments/types/network'
import axios from 'axios'

import { OneInchSwapResponse } from '../../types/common'

const defaultExchangeProtocols = [
  'UNISWAP_V3',
  'PMM1',
  'PMM2',
  'PMM3',
  'PMM4',
  'UNISWAP_V2',
  'SUSHI',
  'CURVE',
  'CURVE_V2',
  'PSM',
  'WSTETH',
  'BALANCER',
  'BALANCER_V2',
  'BALANCER_V2_WRAPPER',
  'ST_ETH',
  'WETH',
  'ROCKET_POOL',
]

export function formatOneInchSwapUrl(
  fromToken: string,
  toToken: string,
  amount: string,
  slippage: string,
  recipient: string,
  protocols: string[] = defaultExchangeProtocols,
  chainId = 1,
  version = 'v4.0',
) {
  const protocolsParam = !protocols?.length ? '' : `&protocols=${protocols.join(',')}`
  return `https://oasis.api.enterprise.1inch.exchange/${version}/${chainId}/swap?fromTokenAddress=${fromToken.toLowerCase()}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${recipient}&slippage=${slippage}${protocolsParam}&disableEstimate=true&allowPartialFill=false`
}

export async function exchangeTokens(url: string): Promise<OneInchSwapResponse> {
  const response = await axios.get(url)

  if (!(response.status === 200 && response.statusText === 'OK')) {
    throw new Error(`Error performing 1inch swap request ${url}: ${await response.data}`)
  }

  return response.data as Promise<OneInchSwapResponse>
}

export async function swapOneInchTokens(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  recipient: string,
  slippage: string,
  protocols?: string[],
  chainId = 1,
  version = 'v4.0',
): Promise<OneInchSwapResponse> {
  const url = formatOneInchSwapUrl(
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippage,
    recipient,
    protocols,
    chainId,
    version,
  )

  return exchangeTokens(url)
}

export async function exchangeFromDAI(
  toTokenAddress: string,
  amount: string,
  slippage: string,
  recepient: string,
  protocols: string[] = [],
): Promise<OneInchSwapResponse> {
  const url = formatOneInchSwapUrl(
    ADDRESSES[Network.MAINNET].common.DAI,
    toTokenAddress,
    amount,
    slippage,
    recepient,
    protocols,
  )

  return exchangeTokens(url)
}

export async function exchangeToDAI(
  fromTokenAddress: string,
  amount: string,
  recepient: string,
  slippage: string,
  protocols: string[] = [],
): Promise<OneInchSwapResponse> {
  const url = formatOneInchSwapUrl(
    fromTokenAddress,
    ADDRESSES[Network.MAINNET].common.DAI,
    amount,
    slippage,
    recepient,
    protocols,
  )

  return exchangeTokens(url)
}
