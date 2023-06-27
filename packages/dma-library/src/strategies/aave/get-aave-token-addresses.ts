import { EMPTY_ADDRESS } from '@dma-common/constants'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import { AAVETokens } from '@dma-library/types/aave'
import { WithAaveStrategyArgs } from '@dma-library/types/strategy-params'

export const getAaveTokenAddress = (
  token: { symbol: AAVETokens },
  addresses: AAVEStrategyAddresses | AAVEV3StrategyAddresses,
) => {
  const tokenAddresses: Record<AAVETokens, string> = {
    WETH: addresses.WETH,
    ETH: addresses.WETH,
    STETH: 'STETH' in addresses ? addresses.STETH : EMPTY_ADDRESS,
    WSTETH: 'WSTETH' in addresses ? addresses.WSTETH : EMPTY_ADDRESS,
    USDC: addresses.USDC,
    WBTC: addresses.WBTC,
    CBETH: 'CBETH' in addresses ? addresses.CBETH : EMPTY_ADDRESS,
    RETH: 'RETH' in addresses ? addresses.RETH : EMPTY_ADDRESS,
  }
  const tokenAddress = tokenAddresses[token.symbol]

  if (!tokenAddress) throw new Error('Token not recognised or address missing in dependencies')

  return tokenAddress
}

/** @deprecated use getAaveTokenAddress instead */
export const getAaveTokenAddresses = (
  args: {
    collateralToken: WithAaveStrategyArgs['collateralToken']
    debtToken: WithAaveStrategyArgs['debtToken']
  },
  addresses: AAVEStrategyAddresses | AAVEV3StrategyAddresses,
): {
  collateralTokenAddress: string
  debtTokenAddress: string
} => {
  const collateralTokenAddress = getAaveTokenAddress(args.collateralToken, addresses)
  const debtTokenAddress = getAaveTokenAddress(args.debtToken, addresses)

  return { collateralTokenAddress, debtTokenAddress }
}
