import { ADDRESSES } from './addresses'

/**
 * Prefers sourceToken over targetToken
 * Accepts args as either a token symbol or eth address
 * @param sourceToken
 * @param targetToken
 */
type TokenSymbolOrAddress = string

export function acceptedFeeToken(
  sourceToken: TokenSymbolOrAddress,
  targetToken: TokenSymbolOrAddress,
) {
  if (acceptSourceToken(sourceToken)) return 'sourceToken'
  if (acceptTargetToken(targetToken)) return 'targetToken'

  const fallbackTokenType = 'sourceToken'
  return fallbackTokenType
}

function acceptSourceToken(sourceToken: TokenSymbolOrAddress) {
  return acceptedTokenSymbols.includes(sourceToken) || acceptedTokenAddresses.includes(sourceToken)
}

function acceptTargetToken(targetToken: TokenSymbolOrAddress) {
  return acceptedTokenSymbols.includes(targetToken) || acceptedTokenAddresses.includes(targetToken)
}

const acceptedTokenSymbols = ['ETH', 'WETH', 'USDT', 'USDC', 'WBTC', 'DAI']
const acceptedTokenAddresses = [
  ADDRESSES.main.ETH,
  ADDRESSES.main.WETH,
  ADDRESSES.main.USDT,
  ADDRESSES.main.USDC,
  ADDRESSES.main.WBTC,
  ADDRESSES.main.DAI,
]
