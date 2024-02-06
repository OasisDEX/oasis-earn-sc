import { Contract, ethers, providers } from 'ethers'

export type UnboxPromise<T> = T extends Promise<infer U> ? U : T
export type UnboxArray<T> = T extends Array<infer U> ? U : T
export type Unbox<T> = UnboxArray<UnboxPromise<T>>

export type CollectFeeFrom = 'sourceToken' | 'targetToken'

export type Debug = {
  debug?: boolean
}

export type FormatUnit = {
  decimals?: number
  isFormatted?: boolean
}

export interface RuntimeConfig {
  provider: providers.JsonRpcProvider
  signer: ethers.Signer
  address: string
}

export type WithRuntimeConfig = {
  config: RuntimeConfig
}

export type BalanceOptions = Debug & FormatUnit & WithRuntimeConfig

export interface OneInchBaseResponse {
  toTokenAmount: string
  fromTokenAmount: string
}

export interface OneInchSwapResponse extends OneInchBaseResponse {
  protocols: any
  tx: {
    from: string
    to: string
    data: string
    value: string
    gasPrice: string
  }
}

export type FakeRequestEnv = {
  mockExchange: Contract
  fakeWETH: Contract
  fakeDAI: Contract
}

export type OneInchSwapRequest = {
  fromTokenAddress: string
  toTokenAddress: string
  amount: string
  recipient: string
  slippage: string
  protocols?: string[]
  chainId?: number
  version?: string
  fakeRequestEnv?: FakeRequestEnv
}

export type SwapData = {
  fromAsset: string
  toAsset: string
  amount: string
  receiveAtLeast: string
  fee: number
  withData: any
  collectFeeInFromToken: boolean
}

export type ExchangeData = {
  fromTokenAddress: string
  toTokenAddress: string
  fromTokenAmount: string
  toTokenAmount: string
  minToTokenAmount: string
  exchangeAddress: string
  _exchangeCalldata: any
}
