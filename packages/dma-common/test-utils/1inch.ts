import { ONE } from '@dma-common/constants'
import { OneInchSwapResponse } from '@dma-common/types/common'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { ADDRESSES } from '@dma-deployments/addresses'
import { Network } from '@dma-deployments/types/network'
import axios from 'axios'
import BigNumber from 'bignumber.js'

const testMarketPrice = 0.979
export const oneInchCallMock =
  (
    marketPrice: BigNumber = new BigNumber(testMarketPrice),
    precision: { from: number; to: number } = { from: 18, to: 18 },
    debug = false,
  ) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    // EG FROM WBTC 8 to USDC 6
    // Convert WBTC fromWei
    // Apply market price
    // Convert result back to USDC at precision 6
    const precisionAdjustedToAmount = amountToWei(
      amountFromWei(amount, precision.from).div(marketPrice),
      precision.to,
    ).integerValue(BigNumber.ROUND_DOWN)

    if (debug) {
      console.log('OneInchCallMock')
      console.log('Amount to swap:', amount.toString())
      console.log('Market price:', marketPrice.toString())
      console.log('Precision from:', precision.from)
      console.log('Precision to:', precision.to)
      console.log('Received amount:', precisionAdjustedToAmount.toString())
    }

    return {
      fromTokenAddress: from,
      toTokenAddress: to,
      fromTokenAmount: amount,
      toTokenAmount: precisionAdjustedToAmount,
      minToTokenAmount: precisionAdjustedToAmount
        .times(new BigNumber(1).minus(slippage))
        .integerValue(BigNumber.ROUND_DOWN), // TODO: figure out slippage
      exchangeCalldata: 0,
    }
  }

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

type OneInchVersion = 'v4.0' | 'v5.0'
export const oneInchVersionMap: Record<
  Exclude<Network, Network.LOCAL | Network.HARDHAT | Network.GOERLI>,
  OneInchVersion
> = {
  [Network.MAINNET]: 'v4.0',
  [Network.OPTIMISM]: 'v5.0',
}

export function resolveOneInchVersion(network: Network): OneInchVersion {
  if (network !== Network.MAINNET && network !== Network.OPTIMISM)
    throw new Error('Unsupported network')

  const version = oneInchVersionMap[network]
  if (!version) throw new Error('Unsupported network')
  return version
}

export const getOneInchCall =
  (
    swapAddress: string,
    protocols?: string[],
    chainId?: number,
    version?: 'v4.0' | 'v5.0',
    debug?: true,
  ) =>
  async (from: string, to: string, amount: BigNumber, slippage: BigNumber) => {
    const slippageAsPercentage = slippage.times(100).toString()
    if (debug) {
      console.log('1inch: Pre call')
      console.log('from:', from)
      console.log('to:', to)
      console.log('amount:', amount.toString())
      console.log('slippage', `${slippageAsPercentage.toString()}%`)
      console.log('chainId:', chainId || 1)
      console.log('version:', version || 'v4.0')
    }
    const response = await swapOneInchTokens(
      from,
      to,
      amount.toString(),
      swapAddress,
      slippageAsPercentage.toString(),
      protocols,
      chainId,
      version,
    )

    const minToTokenAmount = new BigNumber(response.toTokenAmount)
      .times(ONE.minus(slippage))
      .integerValue(BigNumber.ROUND_DOWN)

    if (debug) {
      console.log('1inch: Post call')
      console.log('fromTokenAmount', response?.fromTokenAmount.toString())
      console.log('toTokenAmount', response?.toTokenAmount.toString())
      console.log('minToTokenAmount', minToTokenAmount.toString())
      console.log('routes', response?.protocols[0])
    }

    return {
      toTokenAddress: to,
      fromTokenAddress: from,
      minToTokenAmount: minToTokenAmount,
      toTokenAmount: new BigNumber(response.toTokenAmount),
      fromTokenAmount: new BigNumber(response.fromTokenAmount),
      exchangeCalldata: response.tx.data,
    }
  }

export const optimismLiquidityProviders = [
  'OPTIMISM_UNISWAP_V3',
  'OPTIMISM_SYNTHETIX',
  'OPTIMISM_SYNTHETIX_WRAPPER',
  'OPTIMISM_ONE_INCH_LIMIT_ORDER',
  'OPTIMISM_ONE_INCH_LIMIT_ORDER_V2',
  'OPTIMISM_ONE_INCH_LIMIT_ORDER_V3',
  'OPTIMISM_CURVE',
  'OPTIMISM_BALANCER_V2',
  'OPTIMISM_VELODROME',
  'OPTIMISM_KYBERSWAP_ELASTIC',
  'OPTIMISM_CLIPPER_COVES',
  'OPTIMISM_KYBER_DMM_STATIC',
  'OPTIMISM_AAVE_V3',
  'OPTIMISM_ELK',
  'OPTIMISM_WOOFI_V2',
  'OPTIMISM_TRIDENT',
  'OPTIMISM_MUMMY_FINANCE',
]
