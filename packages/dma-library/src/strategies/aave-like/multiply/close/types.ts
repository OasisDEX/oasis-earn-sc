import { AaveLikePositionV2, FlashloanProvider, SummerStrategy } from '@dma-library/types'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'
import { WithFlashLoanArgs } from '@dma-library/types/strategy-params'
import { BigNumber } from 'bignumber.js'

export type AaveLikeCloseArgs = StrategyParams.WithAaveLikeMultiplyStrategyArgs &
  StrategyParams.WithCloseToCollateralFlag &
  Partial<StrategyParams.WithFlashLoanArgs>

export type AaveLikeExpandedCloseArgs = AaveLikeCloseArgs &
  StrategyParams.WithProtocolData & {
    collateralToken: AaveLikeCloseArgs['collateralToken'] & { address: string }
    debtToken: AaveLikeCloseArgs['debtToken'] & { address: string }
  } & WithFlashLoanArgs

export type CloseFlashloanArgs = {
  token: {
    amount: BigNumber
    precision: number
    symbol: string
    address: string
  }
  provider: FlashloanProvider
}

export type AaveLikeCloseDependencies = StrategyParams.WithAaveLikeMultiplyStrategyDependencies &
  StrategyParams.WithGetSwap &
  StrategyParams.WithPositionType

export type ICloseStrategy = Strategies.IMultiplyStrategy
export type AaveLikeClose = (
  args: AaveLikeCloseArgs,
  dependencies: AaveLikeCloseDependencies,
) => Promise<ICloseStrategy>

export type AaveLikeCloseArgsOmni = AaveLikeCloseArgs & StrategyParams.WithAaveLikePositionV2

export type AaveLikeCloseDependenciesOmni = AaveLikeCloseDependencies &
  StrategyParams.WithAaveLikeWithOperationExecutor &
  StrategyParams.WithProvider

export type AaveLikeCloseOmni = (
  args: AaveLikeCloseArgsOmni,
  dependencies: AaveLikeCloseDependenciesOmni,
) => Promise<SummerStrategy<AaveLikePositionV2>>
