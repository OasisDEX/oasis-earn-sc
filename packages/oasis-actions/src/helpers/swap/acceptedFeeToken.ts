import { acceptedTokens } from '../../config/acceptedFeeTokensConfig'

type TokenSymbolOrAddress = string

interface Props {
  fromToken: TokenSymbolOrAddress
  toToken: TokenSymbolOrAddress
}

/**
 * Prefers sourceToken over targetToken
 * Accepts args as either a token symbol or in address format
 */
export function acceptedFeeToken({ fromToken, toToken }: Props): 'sourceToken' | 'targetToken' {
  const fromTokenAcceptedIndex = acceptedTokens.findIndex(
    acceptedToken => fromToken === acceptedToken.symbol || fromToken === acceptedToken.address,
  )
  const toTokenAcceptedIndex = acceptedTokens.findIndex(
    acceptedToken => toToken === acceptedToken.symbol || toToken === acceptedToken.address,
  )

  if (fromTokenAcceptedIndex === -1 && toTokenAcceptedIndex === -1) {
    console.warn('Both source and target tokens are not in the accepted fee tokens list')
    const fallbackTokenType = 'sourceToken'
    return fallbackTokenType
  }

  /* Select the token to take the fee from based on priority order */
  return fromTokenAcceptedIndex < toTokenAcceptedIndex ? 'sourceToken' : 'targetToken'
}
