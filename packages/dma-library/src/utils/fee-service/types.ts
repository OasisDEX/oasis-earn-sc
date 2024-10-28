export type OasisPosition = {
  events: OasisEvent[]
}

export type OasisEvent = {
  kind: string
  timestamp: bigint
  swapFromToken?: string | null
  swapToToken?: string | null
  swapFromAmount?: string | null
  swapToAmount?: string | null
  debtToken?: {
    address: string
    symbol: string
    decimals: bigint
  } | null
}
