import { Address } from '@deploy-configurations/types/address'
import { acceptedTokens } from '@dma-library/config/accepted-fee-by-tokens'

type TokensByAddress = {
  fromTokenAddress: Address
  toTokenAddress: Address
}

export function acceptedFeeTokenByAddress({
  fromTokenAddress,
  toTokenAddress,
}: TokensByAddress): 'sourceToken' | 'targetToken' {
  return acceptedFeeToken({
    fromToken: fromTokenAddress,
    toToken: toTokenAddress,
  })
}

type TokensBySymbol = {
  fromTokenSymbol: string
  toTokenSymbol: string
}

export function acceptedFeeTokenBySymbol({
  fromTokenSymbol,
  toTokenSymbol,
}: TokensBySymbol): 'sourceToken' | 'targetToken' {
  return acceptedFeeToken({
    fromToken: fromTokenSymbol,
    toToken: toTokenSymbol,
  })
}

type TokenSymbolOrAddress = string

interface Props {
  // Accepts args as either a token symbol or in address format
  fromToken: TokenSymbolOrAddress
  // Accepts args as either a token symbol or in address format
  toToken: TokenSymbolOrAddress
}

/**
 * @deprecated Use acceptedFeeTokenByAddress or acceptedFeeTokenBySymbol instead
 * Prefers sourceToken over targetToken
 * Accepts args as either a token symbol or in address format
 */
export function acceptedFeeToken({ fromToken, toToken }: Props): 'sourceToken' | 'targetToken' {
  const fallbackTokenType = 'sourceToken'
  const fromTokenAcceptedIndex = acceptedTokens.findIndex(
    acceptedToken =>
      fromToken === acceptedToken.symbol || acceptedToken.address.includes(fromToken),
  )

  const toTokenAcceptedIndex = acceptedTokens.findIndex(
    acceptedToken => toToken === acceptedToken.symbol || acceptedToken.address.includes(toToken),
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
