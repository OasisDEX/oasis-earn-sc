import { ethers } from 'hardhat'
import BigNumber from 'bignumber.js'
import { Signer, providers } from 'ethers'

export type ValueOf<T> = T[keyof T]

export type Debug = {
  debug?: boolean
}

export type FormatUnit = {
  decimals?: number
}

// #region Runtime
export interface RuntimeConfig {
  provider: providers.JsonRpcProvider
  signer: Signer
  address: string
}

export type WithRuntimeConfig = {
  config: RuntimeConfig
}
// #endregion

export type BalanceOptions = Debug & FormatUnit & WithRuntimeConfig

// #region 1inch
export interface OneInchBaseResponse {
  toTokenAmount: string
  fromTokenAmount: string
}

export interface OneInchSwapResponse extends OneInchBaseResponse {
  tx: {
    from: string
    to: string
    data: string
    value: string
    gasPrice: string
  }
}
// #endregion

// #region Common
export enum EventHash {
  ERC20_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  WETH_DEPOSIT = 'e1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c',
  WETH_WITHDRAWAL = '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65',
}

export enum Ticker {
  WETH = 'WETH',
  DAI = 'DAI',
}

// #endregion

// #region Maker
export interface CDPInfo {
  id: number
  ilk: string
  urn: string
}

export interface VaultInfo {
  coll: BigNumber
  debt: BigNumber
}
// #endregion

// #region Test Utility Types
export interface PackedEvent {
  AmountAsNumber: string
  Token: string
  From: string
  To: string
}

// #endregion

// #region Action Param Types
export type SwapData = {
  fromAsset: string
  toAsset: string
  amount: string
  receiveAtLeast: string
  withData: any
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

export type CdpData = {
  skipFL: boolean
  gemJoin: string
  cdpId: number
  ilk: string
  fundsReceiver: string
  borrowCollateral: string
  requiredDebt: string
  daiTopUp: string
  collTopUp: string
  withdrawDai: string
  withdrawCollateral: string
  methodName: string
}

export const swapDataTypeToEncode = `tuple(address fromAsset,
    address toAsset,
    uint256 amount,
    uint256 receiveAtLeast,
    bytes withData) swapData`

export const exchangeDataTypeToEncode = `tuple(address fromTokenAddress, address toTokenAddress, uint256 fromTokenAmount, uint256 toTokenAmount, uint256 minToTokenAmount, address exchangeAddress, bytes _exchangeCalldata) exchangeData`

export const cdpDataTypeToEncode = `tuple(address gemJoin,
  address payable fundsReceiver,
  uint256 cdpId,
  bytes32 ilk,
  uint256 requiredDebt,
  uint256 borrowCollateral,
  uint256 withdrawCollateral,
  uint256 withdrawDai,
  uint256 daiTopUp,
  uint256 collTopUp,
  bool skipFL,
  string methodName) cdpData`

export const addressRegistryTypeToEncode = `tuple(address jug,
              address manager,
              address lender,
              address exchange) addressRegistry`
// #endregion
