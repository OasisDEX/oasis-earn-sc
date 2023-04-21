import { Network } from '@oasisdex/dma-deployments/types/network'
import BigNumber from 'bignumber.js'

import { ONE } from '../../constants'
import { swapOneInchTokens } from './1inch'

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
