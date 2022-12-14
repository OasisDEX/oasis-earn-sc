import { ADDRESSES } from '../../helpers/addresses'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { AAVETokens } from '../../operations/aave/tokens'
import { IPositionTransitionArgs } from '../types/IPositionRepository'

export const mainnetAAVEAddresses = {
  DAI: ADDRESSES.main.DAI,
  ETH: ADDRESSES.main.ETH,
  WETH: ADDRESSES.main.WETH,
  stETH: ADDRESSES.main.stETH,
  wBTC: ADDRESSES.main.WBTC,
  USDC: ADDRESSES.main.USDC,
  chainlinkEthUsdPriceFeed: ADDRESSES.main.chainlinkEthUsdPriceFeed,
  aaveProtocolDataProvider: ADDRESSES.main.aave.DataProvider,
  aavePriceOracle: ADDRESSES.main.aavePriceOracle,
  aaveLendingPool: ADDRESSES.main.aave.MainnetLendingPool,
  operationExecutor: ADDRESSES.main.operationExecutor,
}

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
    stETH: addresses.stETH,
    USDC: addresses.USDC,
    wBTC: addresses.wBTC,
    DAI: addresses.DAI,
  }

  const collateralTokenAddress = tokenAddresses[args.collateralToken.symbol]
  const debtTokenAddress = tokenAddresses[args.debtToken.symbol]

  if (!collateralTokenAddress)
    throw new Error('Collateral token not recognised or address missing in dependencies')
  if (!debtTokenAddress)
    throw new Error('Debt token not recognised or address missing in dependencies')

  return { collateralTokenAddress, debtTokenAddress }
}
