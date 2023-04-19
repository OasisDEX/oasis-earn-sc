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
