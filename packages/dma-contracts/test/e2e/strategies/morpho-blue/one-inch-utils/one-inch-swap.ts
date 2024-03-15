import { ONE } from '@dma-common/constants'
import axios, { AxiosResponse } from 'axios'
import BigNumber from 'bignumber.js'
import * as dotenv from 'dotenv'

import { getOneInchProtocols } from './one-inch-providers'

dotenv.config({ path: '../../.env' })
const ONE_INCH_API_ENDPOINT = process.env.ONE_INCH_API_ENDPOINT || 'https://api.1inch.dev/swap'
if (!ONE_INCH_API_ENDPOINT) {
  throw new Error('ONE_INCH_API_ENDPOINT environment variable is not set')
}

const ONE_INCH_API_KEY = process.env.ONE_INCH_API_KEY
if (!ONE_INCH_API_KEY) {
  throw new Error('ONE_INCH_API_KEY environment variable is not set')
}
export interface OneInchQuoteResponse {
  fromToken: { decimals: number }
  toToken: { decimals: number }
  toAmount: string
}

export interface OneInchSwapResponse extends OneInchQuoteResponse {
  tx: {
    from: string
    to: string
    data: string
    value: string
    gasPrice: string
  }
}
export const getOneInchCall =
  (swapAddress: string, chainId = 1, protocols?: string[], debug?: true) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    const slippageAsPercentage = slippage.times(100).toString()
    if (debug) {
      console.log('1inch: Pre call')
      console.log('from:', from)
      console.log('to:', to)
      console.log('amount:', amount.toString())
      console.log('slippage', `${slippageAsPercentage.toString()}%`)
    }
    let response: OneInchSwapResponse
    try {
      response = await swapOneInchTokens(
        from,
        to,
        amount.toString(),
        swapAddress,
        slippageAsPercentage.toString(),
        chainId,
      )
    } catch (error) {
      throw new Error(`Error performing 1inch swap request: ${error}`)
    }

    const minToTokenAmount = new BigNumber(response.toAmount)
      .times(ONE.minus(slippage))
      .integerValue(BigNumber.ROUND_DOWN)

    if (debug) {
      console.log('1inch: Post call')
      console.log('toTokenAmount', response?.toAmount.toString())
      console.log('minToTokenAmount', minToTokenAmount.toString())
    }
    return {
      toTokenAddress: to,
      fromTokenAddress: from,
      minToTokenAmount: minToTokenAmount,
      toTokenAmount: new BigNumber(response.toAmount),
      fromTokenAmount: amount,
      exchangeCalldata: response.tx.data,
    }
  }

export async function swapOneInchTokens(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  recipient: string,
  slippage: string,
  chainId = 1,
): Promise<OneInchSwapResponse> {
  const url = formatOneInchSwapUrl(
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippage,
    recipient,
    chainId,
  )
  return exchangeTokens(url)
}

export function formatOneInchSwapUrl(
  fromToken: string,
  toToken: string,
  amount: string,
  slippage: string,
  recepient: string,
  chainId = 1,
) {
  const protocolsParam = `&protocols=${getOneInchProtocols(chainId)}`

  return `${ONE_INCH_API_ENDPOINT}/v5.2/${chainId}/swap?src=${fromToken.toLowerCase()}&dst=${toToken}&amount=${amount}&from=${recepient}&slippage=${slippage}${protocolsParam}&disableEstimate=true&allowPartialFill=false&includeTokensInfo=true`
}

export async function exchangeTokens(url: string): Promise<OneInchSwapResponse> {
  let response: AxiosResponse<any, any>
  try {
    response = await axios.get(url, {
      headers: {
        Authorization: 'Bearer ' + ONE_INCH_API_KEY,
        accept: 'application/json',
      },
    })
  } catch (error) {
    console.log(error)
    throw new Error(`Error performing 1inch swap request ${url}: ${error}`)
  }

  if (!(response.status === 200 && response.statusText === 'OK')) {
    console.log(response)
    throw new Error(
      `exchangeTokens/ Error performing 1inch swap request ${url}: ${await response.data}`,
    )
  }

  return response.data as Promise<OneInchSwapResponse>
}
