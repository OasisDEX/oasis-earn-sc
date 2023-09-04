import { EMPTY_ADDRESS } from '@dma-common/constants'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { AaveLikeTokens } from '@dma-library/types'
import { WithAaveStrategyArgs } from '@dma-library/types/strategy-params'

export const getAaveTokenAddress = (
  token: { symbol: AaveLikeTokens },
  addresses: AaveLikeStrategyAddresses,
) => {
  const tokenAddress = addresses.tokens[token.symbol]

  if (token.symbol === 'ETH') {
    return addresses.tokens['WETH']
  }

  if (!tokenAddress || tokenAddress === EMPTY_ADDRESS)
    throw new Error('Token not recognised or address missing in dependencies')

  return tokenAddress
}

/** @deprecated use getAaveTokenAddress instead */
export const getAaveTokenAddresses = (
  args: {
    collateralToken: WithAaveStrategyArgs['collateralToken']
    debtToken: WithAaveStrategyArgs['debtToken']
  },
  addresses: AaveLikeStrategyAddresses,
): {
  collateralTokenAddress: string
  debtTokenAddress: string
} => {
  const collateralTokenAddress = getAaveTokenAddress(args.collateralToken, addresses)
  const debtTokenAddress = getAaveTokenAddress(args.debtToken, addresses)

  return { collateralTokenAddress, debtTokenAddress }
}
