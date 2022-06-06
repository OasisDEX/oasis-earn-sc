import BigNumber from 'bignumber.js'

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

// #region Test Utility Types

export interface PackedEvent {
  AmountAsNumber: string
  Token: string
  From: string
  To: string
}

// #endregion
