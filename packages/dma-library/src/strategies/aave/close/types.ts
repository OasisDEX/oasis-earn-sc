import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import { AaveVersion } from '@dma-library/strategies'
import {
  AAVETokens,
  IBasePositionTransitionArgs,
  IPositionTransitionDependencies,
  PositionType,
  WithLockedCollateral,
} from '@dma-library/types'

export type AaveCloseArgs = IBasePositionTransitionArgs<AAVETokens> & {
  positionType: PositionType
} & WithLockedCollateral & {
    shouldCloseToCollateral?: boolean
  }
export type WithVersioning = {
  protocolVersion: AaveVersion
}
export type AaveCloseArgsWithVersioning = AaveCloseArgs & WithVersioning
export type AaveCloseDependencies =
  | IPositionTransitionDependencies<AAVEStrategyAddresses>
  | IPositionTransitionDependencies<AAVEV3StrategyAddresses>