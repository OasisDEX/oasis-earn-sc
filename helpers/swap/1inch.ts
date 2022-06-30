import { Provider } from '@ethersproject/providers'
import { ethers, Signer } from 'ethers'
import fetch from 'node-fetch'

import UniswapRouterV3ABI from '../../abi/IUniswapRouter.json'
import { ADDRESSES } from '../addresses'
import { OneInchSwapResponse } from '../types/common'

export function formatOneInchSwapUrl(
  fromToken: string,
  toToken: string,
  amount: string,
  slippage: string,
  recepient: string,
  protocols: string[] = [],
) {
  const protocolsParam = !protocols?.length ? '' : `&protocols=${protocols.join(',')}`
  return `https://oasis.api.enterprise.1inch.exchange/v4.0/1/swap?fromTokenAddress=${fromToken.toLowerCase()}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${recepient}&slippage=${slippage}${protocolsParam}&disableEstimate=true&allowPartialFill=false`
}

export async function exchangeTokens(url: string): Promise<OneInchSwapResponse> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Error performing 1inch swap request ${url}: ${await response.text()}`)
  }

  return response.json() as Promise<OneInchSwapResponse>
}

export async function swapOneInchTokens(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  recipient: string,
  slippage: string,
  protocols: string[] = [],
): Promise<OneInchSwapResponse> {
  const url = formatOneInchSwapUrl(
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippage,
    recipient,
    protocols,
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
    ADDRESSES.main.DAI,
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
    ADDRESSES.main.DAI,
    amount,
    slippage,
    recepient,
    protocols,
  )

  return exchangeTokens(url)
}
