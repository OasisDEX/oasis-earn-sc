export type AAVETokens = 'ETH' | 'WETH' | 'stETH' | 'wBTC' | 'USDC' | 'DAI'

export type TokenDef<Tokens> = {
  symbol: Tokens
  precision: number
}

export const TOKEN_DEFINITIONS: Record<AAVETokens, TokenDef<AAVETokens>> = {
  ETH: {
    symbol: 'ETH',
    precision: 18,
  } as TokenDef<AAVETokens>,
  WETH: {
    symbol: 'WETH',
    precision: 18,
  } as TokenDef<AAVETokens>,
  stETH: {
    symbol: 'stETH',
    precision: 18,
  } as TokenDef<AAVETokens>,
  DAI: {
    symbol: 'DAI',
    precision: 18,
  } as TokenDef<AAVETokens>,
  USDC: {
    symbol: 'USDC',
    precision: 6,
  } as TokenDef<AAVETokens>,
  wBTC: {
    symbol: 'wBTC',
    precision: 8,
  } as TokenDef<AAVETokens>,
}
