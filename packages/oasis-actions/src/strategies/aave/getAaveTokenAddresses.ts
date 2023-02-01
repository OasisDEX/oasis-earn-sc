import { AAVEStrategyAddresses } from '../../operations/aave/v2'
import { AAVEV3StrategyAddresses } from '../../operations/aave/v3'
import { IPositionTransitionArgs } from '../../types'
import { AAVETokens } from '../../types/aave/tokens'

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
  const aaveV2OnlyAddressName = 'lendingPool'
  const aaveV3OnlyAddressName = 'pool'
  if (aaveV2OnlyAddressName in addresses && args.collateralToken.symbol === 'WSTETH') {
    throw new Error('WSTETH is not supported on Aave V2')
  }

  const tokenAddresses: Record<AAVETokens, string> = {
    WETH: addresses.WETH,
    ETH: addresses.WETH,
    WSTETH: emptyAddress,
    STETH: addresses.STETH,
    USDC: addresses.USDC,
    WBTC: addresses.WBTC,
  }
  /* Checks for V3 addresses */
  if (aaveV3OnlyAddressName in addresses) {
    tokenAddresses['WSTETH'] = addresses.WSTETH
  }

  const collateralTokenAddress = tokenAddresses[args.collateralToken.symbol]
  const debtTokenAddress = tokenAddresses[args.debtToken.symbol]

  if (!collateralTokenAddress)
    throw new Error('Collateral token not recognised or address missing in dependencies')
  if (!debtTokenAddress)
    throw new Error('Debt token not recognised or address missing in dependencies')

  return { collateralTokenAddress, debtTokenAddress }
}
