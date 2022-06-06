import { ethers } from 'hardhat'
import fetch from 'node-fetch'
import BigNumber from 'bignumber.js'
import MAINNET_ADDRESSES from '../../addresses/mainnet.json'
import { OneInchBaseResponse, OneInchSwapResponse } from './common.types'

export async function getMarketPrice(
  from: string,
  to: string,
  fromPrecision = 18,
  toPrecision = 18,
) {
  const amount = ethers.utils.parseUnits('0.1', fromPrecision)
  const url = `https://api.1inch.exchange/v4.0/1/quote?fromTokenAddress=${from}&toTokenAddress=${to}&amount=${amount}&protocols=UNISWAP_V3`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Error performing 1inch quote request ${url}: ${await response.text()}`)
  }

  const result = (await response.json()) as OneInchBaseResponse

  const fromTokenAmount = new BigNumber(
    ethers.utils.formatUnits(result.fromTokenAmount, fromPrecision),
  )
  const toTokenAmount = new BigNumber(ethers.utils.formatUnits(result.toTokenAmount, toPrecision))

  return toTokenAmount.div(fromTokenAmount)
}

export async function getCurrentBlockNumber() {
  const timestamp = Math.floor(Date.now() / 1000)
  const url = `https://api.etherscan.io/api?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=YAJI4NVD8QTQ9JVWG2NKN3FFUK6IZTMV5S` // TODO: remove api key

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Could not fetch current block from etherscan: ${await response.text()}`)
  }

  const body = (await response.json()) as { result: string }
  return parseInt(body.result)
}

function formatOneInchSwapUrl(
  fromToken: string,
  toToken: string,
  amount: string,
  slippage: string,
  recepient: string,
  protocols: string[] = [],
) {
  const protocolsParam = !protocols?.length ? '' : `&protocols=${protocols.join(',')}`
  return `https://oasis.api.enterprise.1inch.exchange/v4.0/1/swap?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${recepient}&slippage=${slippage}${protocolsParam}&disableEstimate=true&allowPartialFill=false`
}

async function exchangeTokens(url: string): Promise<OneInchSwapResponse> {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Error performing 1inch swap request ${url}: ${await response.text()}`)
  }

  return response.json()
}

export async function exchangeFromDAI(
  toTokenAddress: string,
  amount: string,
  slippage: string,
  recepient: string,
  protocols: string[] = [],
): Promise<OneInchSwapResponse> {
  const url = formatOneInchSwapUrl(
    MAINNET_ADDRESSES.MCD_DAI,
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
    MAINNET_ADDRESSES.MCD_DAI,
    amount,
    slippage,
    recepient,
    protocols,
  )

  return exchangeTokens(url)
}
