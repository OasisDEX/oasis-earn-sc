import { acceptedTokenAddresses, acceptedTokenSymbols } from '../config/acceptedFeeTokensConfig'

type TokenSymbolOrAddress = string

interface Props {
  fromToken: TokenSymbolOrAddress
  toToken: TokenSymbolOrAddress
}

/**
 * Prefers sourceToken over targetToken
 * Accepts args as either a token symbol or in address format
 */
export function acceptedFeeToken({ fromToken, toToken }: Props) {
  if (acceptSourceToken(fromToken)) return 'sourceToken'
  if (acceptTargetToken(toToken)) return 'targetToken'

  const fallbackTokenType = 'sourceToken'
  return fallbackTokenType
}

function acceptSourceToken(sourceToken: TokenSymbolOrAddress) {
  return acceptedTokenSymbols.includes(sourceToken) || acceptedTokenAddresses.includes(sourceToken)
}

function acceptTargetToken(targetToken: TokenSymbolOrAddress) {
  return acceptedTokenSymbols.includes(targetToken) || acceptedTokenAddresses.includes(targetToken)
}
