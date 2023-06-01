import { ethUsdcMultiplyAjnaPosition } from './eth-usdc-multiply'

// interface PositionFactoryArgs {
//   collateralPrice: BigNumber
//   quotePrice: BigNumber
//   pool: AjnaPool
//   tokens: any
//   proxy: string
//   dependencies: Omit<StrategyDependenciesAjna, 'getSwapData'> & {
//     getSwapData: AjnaPositionDetails['getSwapData']
//   }
// }

export const ajnaFactories = {
  [ethUsdcMultiplyAjnaPosition.positionVariant]: ethUsdcMultiplyAjnaPosition,
}
