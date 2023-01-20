import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { AAVETokens } from '../types/aave/tokens'
import { IPositionTransitionArgs } from '../types/IPositionRepository'

export const getAAVETokenAddresses = (
  args: {
    collateralToken: IPositionTransitionArgs<AAVETokens>['collateralToken']
    debtToken: IPositionTransitionArgs<AAVETokens>['debtToken']
  },
  addresses: AAVEStrategyAddresses,
): {
  collateralTokenAddress: string
  debtTokenAddress: string
} => {
  const tokenAddresses: Record<AAVETokens, string> = {
    WETH: addresses.WETH,
    ETH: addresses.WETH,
    STETH: addresses.STETH,
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
