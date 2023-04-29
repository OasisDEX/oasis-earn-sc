import { ethers, providers } from 'ethers'

export type UnboxPromise<T> = T extends Promise<infer U> ? U : T
export type UnboxArray<T> = T extends Array<infer U> ? U : T
export type Unbox<T> = UnboxArray<UnboxPromise<T>>

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never

export type NestedKeys<T extends object> = UnionToIntersection<T[keyof T]>

export type AllValues<T> = { [K in keyof T]: T[K] extends object ? AllValues<T[K]> : T[K] }[keyof T]

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
