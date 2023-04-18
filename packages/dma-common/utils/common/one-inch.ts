import axios from 'axios'
import BigNumber from 'bignumber.js'

import { OneInchQuoteResponse, OneInchSwapResponse } from './types'

const API_ENDPOINT = `https://oasis.api.enterprise.1inch.exchange/v4.0/1`
const ONE_INCH_PROTOCOLS = ['UNISWAP_V3', 'PMM4', 'UNISWAP_V2', 'SUSHI', 'CURVE', 'PSM']

export async function getQuote(daiAddress: string, collateralAddress: string, amount: BigNumber) {
  const { data } = await axios.get<OneInchQuoteResponse>(`${API_ENDPOINT}/quote`, {
    params: {
      fromTokenAddress: collateralAddress,
      toTokenAddress: daiAddress,
      amount: amount.toFixed(0),
    },
  })
  const collateralAmount = new BigNumber(data.fromTokenAmount).shiftedBy(-data.fromToken.decimals)
  const daiAmount = new BigNumber(data.toTokenAmount).shiftedBy(-data.toToken.decimals)
  return daiAmount.div(collateralAmount)
}

export async function getSwap(
  fromTokenAddress: string,
  toTokenAddress: string,
  sender: string,
  amount: BigNumber,
  slippage: BigNumber,
  debug = false,
) {
  const params = {
    fromTokenAddress,
    toTokenAddress,
    amount: amount.toFixed(0),
    fromAddress: sender,
    slippage: slippage.toString(),
    disableEstimate: true,
    allowPartialFill: false,
    protocols: ONE_INCH_PROTOCOLS.join(','),
  }

  if (debug) console.log('One inch params', params)

  const { data } = await axios.get<OneInchSwapResponse>(`${API_ENDPOINT}/swap`, {
    params,
  })

  if (debug) console.log('One inch payload', data)

  const collateralAmount = new BigNumber(data.fromTokenAmount).shiftedBy(-data.fromToken.decimals)
  const daiAmount = new BigNumber(data.toTokenAmount).shiftedBy(-data.toToken.decimals)
  return {
    fromTokenAmount: collateralAmount,
    toTokenAmount: daiAmount,
    tokenPrice: daiAmount.div(collateralAmount),
    tx: data.tx,
    fromToken: data.fromToken,
    toToken: data.toToken,
  }
}
