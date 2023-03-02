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
  const fallbackTokenType = 'sourceToken'
  const fromTokenAcceptedIndex = acceptedTokens.findIndex(
    acceptedToken => fromToken === acceptedToken.symbol || fromToken === acceptedToken.address,
  )

  const toTokenAcceptedIndex = acceptedTokens.findIndex(
    acceptedToken => toToken === acceptedToken.symbol || toToken === acceptedToken.address,
  )

  const fromTokenNotAccepted = fromTokenAcceptedIndex === -1
  const toTokenAccepted = toTokenAcceptedIndex !== -1
  const toTokenNotAccepted = toTokenAcceptedIndex === -1

  // If neither tokens are in the accepted fee tokens list, return the fallback token type
  if (fromTokenNotAccepted && toTokenNotAccepted) {
    console.warn('Both source and target tokens are not in the accepted fee tokens list')
    return fallbackTokenType
  }

  // If the target token is not in the list anyway, then the fallback/source token is the only option remaining
  if (toTokenNotAccepted) {
    return fallbackTokenType
  }

  // If the from token is not in the list but the to token is, then the to token is the only option remaining
  if (fromTokenNotAccepted && toTokenAccepted) {
    return 'targetToken'
  }

  /* otherwise select the token to take the fee from based on priority order where all remaining indexes are greater than -1 */
  return fromTokenAcceptedIndex < toTokenAcceptedIndex ? 'sourceToken' : 'targetToken'
}
