export enum Network {
  MAINNET = 'mainnet',
  GOERLI = 'goerli',
  HARDHAT = 'hardhat',
  LOCAL = 'local',
}

export const ChainById: { [key: number]: Network } = {
  1: Network.MAINNET,
  5: Network.GOERLI,
}

export function getNetworkFromChainId(chainId: number): Network {
  return ChainById[chainId]
}

export function isSupportedNetwork(network: string): network is Network {
  return Object.values<string>(Network).includes(network)
}

export interface OneInchQuoteResponse {
  fromToken: { decimals: number }
  toToken: { decimals: number }
  toTokenAmount: string
  fromTokenAmount: string
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

export interface EtherscanGasPrice {
  result: {
    LastBlock: string
    SafeGasPrice: string
    ProposeGasPrice: string
    FastGasPrice: string
    suggestBaseFee: string
  }
}
