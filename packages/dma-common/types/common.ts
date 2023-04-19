import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/types'
import { ethers, providers } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export type ValueOf<T> = T[keyof T]

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

export type HardhatRuntimeConfig = {
  ethers: typeof ethers & HardhatEthersHelpers
  network: HardhatRuntimeEnvironment['network']
} & RuntimeConfig

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

export enum EventHash {
  ERC20_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  WETH_DEPOSIT = 'e1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c',
  WETH_WITHDRAWAL = '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65',
}

export enum Ticker {
  WETH = 'WETH',
  DAI = 'DAI',
}

export interface PackedEvent {
  AmountAsNumber: string
  Token: string
  From: string
  To: string
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
