import { AAVEStrategyAddresses } from '../../operations/aave/v2'
import { AAVEV3StrategyAddresses } from '../../operations/aave/v3'
import { IPositionTransitionArgs } from '../../types'
import { AAVETokens } from '../../types/aave'

const emptyAddress = ''

export const getAaveTokenAddresses = (
  args: {
    collateralToken: IPositionTransitionArgs<AAVETokens>['collateralToken']
    debtToken: IPositionTransitionArgs<AAVETokens>['debtToken']
  },
  addresses: AAVEStrategyAddresses | AAVEV3StrategyAddresses,
): {
  collateralTokenAddress: string
  debtTokenAddress: string
} => {
  const tokenAddresses: Record<AAVETokens, string> = {
    WETH: addresses.WETH,
    ETH: addresses.WETH,
    STETH: 'STETH' in addresses ? addresses.STETH : emptyAddress,
    WSTETH: 'WSTETH' in addresses ? addresses.WSTETH : emptyAddress,
    USDC: addresses.USDC,
    WBTC: addresses.WBTC,
  }

  const collateralTokenAddress = tokenAddresses[args.collateralToken.symbol]
  const debtTokenAddress = tokenAddresses[args.debtToken.symbol]

  if (!collateralTokenAddress)
    throw new Error('Collateral token not recognised or address missing in dependencies')
  if (!debtTokenAddress)
    throw new Error('Debt token not recognised or address missing in dependencies')

  return { collateralTokenAddress, debtTokenAddress }
}
