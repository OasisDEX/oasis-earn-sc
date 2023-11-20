import { ADDRESSES } from '@deploy-configurations/addresses'
import { Network } from '@deploy-configurations/types/network'
import { ONE } from '@dma-common/constants'
import { FakeRequestEnv, OneInchSwapRequest, OneInchSwapResponse } from '@dma-common/types/common'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import axios from 'axios'
import BigNumber from 'bignumber.js'

export const ONE_INCH_API_URL = 'https://api-oasis.1inch.io'

/**
 * Returns the auth header for 1inch API calls
 * @throws {Error} - if process.env.ONE_INCH_API_KEY is not defined
 * @returns {Object} - { auth-key: process.env.ONE_INCH_API_KEY }
 */
export const getOneInchAuthHeader = () => {
  const AUTH_HEADER_KEY = 'auth-key'

  if (!process.env.ONE_INCH_API_KEY) {
    throw new Error('ONE_INCH_API_KEY is not defined')
  }

  return { [AUTH_HEADER_KEY]: process.env.ONE_INCH_API_KEY }
}

const testMarketPrice = 0.979
export const oneInchCallMock =
  (
    marketPrice: BigNumber = new BigNumber(testMarketPrice),
    precision: { from: number; to: number } = { from: 18, to: 18 },
    debug = false,
  ) =>
  // Swap Direction Inversion is needed for use in tests where a preflight market price for a given token
  // is required - EG in the case of Close to Collateral
  async (
    from: string,
    to: string,
    amount: BigNumber,
    slippage: BigNumber,
    protocols?: string[],
    __invertSwapDirection?: boolean,
  ) => {
    // EG FROM WBTC 8 to USDC 6
    // Convert WBTC fromWei
    // Apply market price
    // Convert result back to USDC at precision 6
    const fromTokenPrecision = __invertSwapDirection ? precision.to : precision.from
    const toTokenPrecision = __invertSwapDirection ? precision.from : precision.to
    const _marketPrice = __invertSwapDirection ? ONE.div(marketPrice) : marketPrice

    const precisionAdjustedToAmount = amountToWei(
      amountFromWei(amount, fromTokenPrecision).div(_marketPrice),
      toTokenPrecision,
    ).integerValue(BigNumber.ROUND_DOWN)

    if (debug) {
      console.log('OneInchCallMock')
      console.log('Amount to swap:', amount.toString())
      console.log('Market price:', marketPrice.toString())
      console.log('Precision from:', fromTokenPrecision)
      console.log('Precision to:', toTokenPrecision)
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

export function formatOneInchSwapUrl({
  fromTokenAddress,
  toTokenAddress,
  amount,
  recipient,
  slippage,
  protocols = defaultExchangeProtocols,
  chainId = 1,
  version = 'v4.0',
}: OneInchSwapRequest) {
  const protocolsParam = !protocols?.length ? '' : `&protocols=${protocols.join(',')}`
  return `${ONE_INCH_API_URL}/${version}/${chainId}/swap?fromTokenAddress=${fromTokenAddress.toLowerCase()}&toTokenAddress=${toTokenAddress}&amount=${amount}&fromAddress=${recipient}&slippage=${slippage}${protocolsParam}&disableEstimate=true&allowPartialFill=false`
}

export async function exchangeTokens(request: OneInchSwapRequest): Promise<OneInchSwapResponse> {
  if (request.fakeRequestEnv) {
    const feeOnTransfer =
      request.toTokenAddress === request.fakeRequestEnv.fakeDAI.address ||
      request.fromTokenAddress === request.fakeRequestEnv.fakeDAI.address

    const [toTokenAmount] = await request.fakeRequestEnv.mockExchange.calculateOutputAmount(
      request.fromTokenAddress,
      request.toTokenAddress,
      request.amount,
      feeOnTransfer,
    )
    const calldata = request.fakeRequestEnv.mockExchange.interface.encodeFunctionData('swap', [
      request.fromTokenAddress,
      request.toTokenAddress,
      request.amount,
      feeOnTransfer,
    ])

    // Use the deployed Fake contract
    const response: OneInchSwapResponse = {
      toTokenAmount: toTokenAmount.toString(),
      fromTokenAmount: request.amount,
      protocols: request.protocols,
      tx: {
        from: request.recipient,
        to: request.fakeRequestEnv.mockExchange.address,
        data: calldata,
        value: '0', // assumes only ERC20 swaps
        gasPrice: '6994090150', // just a normal gas price, taken from 1inch API docs
      },
    }

    return response
  } else {
    if (!process.env.ONE_INCH_API_KEY) {
      throw new Error(
        'Either ONE_INCH_API_KEY in .env file or a dummy exchange in parameters is required',
      )
    }
    const url = formatOneInchSwapUrl(request)

    const oneInchAuthHeader = getOneInchAuthHeader()

    const response = await axios.get(url, {
      headers: oneInchAuthHeader,
    })

    if (!(response.status === 200 && response.statusText === 'OK')) {
      throw new Error(`Error performing 1inch swap request ${url}: ${await response.data}`)
    }

    return response.data as Promise<OneInchSwapResponse>
  }
}

export async function swapOneInchTokens(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  recipient: string,
  slippage: string,
  protocols?: string[],
  fakeRequestEnv?: FakeRequestEnv,
  chainId = 1,
  version = 'v4.0',
): Promise<OneInchSwapResponse> {
  const request: OneInchSwapRequest = {
    fromTokenAddress,
    toTokenAddress,
    amount,
    recipient,
    slippage,
    protocols,
    chainId,
    version,
    fakeRequestEnv,
  }

  return exchangeTokens(request)
}

export async function exchangeFromDAI(
  toTokenAddress: string,
  amount: string,
  recipient: string,
  slippage: string,
  protocols: string[] = [],
  fakeRequestEnv?: FakeRequestEnv,
): Promise<OneInchSwapResponse> {
  const request: OneInchSwapRequest = {
    fromTokenAddress: fakeRequestEnv
      ? fakeRequestEnv.fakeDAI.address
      : ADDRESSES[Network.MAINNET].common.DAI,
    toTokenAddress,
    amount,
    recipient,
    slippage,
    protocols,
    fakeRequestEnv,
  }

  return exchangeTokens(request)
}

export async function exchangeToDAI(
  fromTokenAddress: string,
  amount: string,
  recipient: string,
  slippage: string,
  protocols: string[] = [],
  fakeRequestEnv?: FakeRequestEnv,
): Promise<OneInchSwapResponse> {
  const request: OneInchSwapRequest = {
    fromTokenAddress,
    toTokenAddress: fakeRequestEnv
      ? fakeRequestEnv.fakeDAI.address
      : ADDRESSES[Network.MAINNET].common.DAI,
    amount,
    recipient,
    slippage,
    protocols,
    fakeRequestEnv,
  }

  return exchangeTokens(request)
}

type OneInchVersion = 'v4.0' | 'v5.0'
// TODO: Let's move entirely to v5.0 on FE as well
export const oneInchVersionMap: Record<
  Exclude<Network, Network.LOCAL | Network.HARDHAT | Network.GOERLI | Network.TEST>,
  OneInchVersion
> = {
  [Network.MAINNET]: 'v4.0',
  [Network.OPTIMISM]: 'v5.0',
  [Network.ARBITRUM]: 'v5.0',
  [Network.BASE]: 'v5.0',
  [Network.TENDERLY]: 'v5.0',
  [Network.SEPOLIA]: 'v5.0',
}

export const oneInchsupportedNetworks = Object.keys(oneInchVersionMap)

export function resolveOneInchVersion(network: Network): OneInchVersion {
  if (!oneInchsupportedNetworks.includes(network)) {
    throw new Error('Unsupported network')
  }

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
      undefined,
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
