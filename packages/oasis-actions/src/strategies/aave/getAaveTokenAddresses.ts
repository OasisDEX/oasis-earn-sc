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
  system: any
  // addresses: AAVEStrategyAddresses | AAVEV3StrategyAddresses,
): {
  collateralTokenAddress: string
  debtTokenAddress: string
} => {

  console.log('system.config.common', system.config.common );
  
  const { WETH, ETH, STETH, WSTETH, USDC, WBTC } = system.config.common

  console.log('WETHHHHH', WETH );
  
  const tokenAddresses: Record<AAVETokens, string> = {
    WETH: WETH.address,
    ETH: WETH.address,
    STETH: STETH.address,
    WSTETH: WSTETH.address,
    USDC: USDC.address,
    WBTC: WBTC.address,
  }

  const collateralTokenAddress = tokenAddresses[args.collateralToken.symbol]
  const debtTokenAddress = tokenAddresses[args.debtToken.symbol]

  if (!collateralTokenAddress)
    throw new Error('Collateral token not recognised or address missing in dependencies')
  if (!debtTokenAddress)
    throw new Error('Debt token not recognised or address missing in dependencies')

  return { collateralTokenAddress, debtTokenAddress }
}
