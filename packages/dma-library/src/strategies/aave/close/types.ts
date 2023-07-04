import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import { AaveVersion } from '@dma-library/strategies'
import { AaveValuesFromProtocol } from '@dma-library/strategies/aave/close/get-values-from-protocol'
import {
  AAVETokens,
  IBasePositionTransitionArgs,
  IPositionTransitionDependencies,
  PositionType,
  WithCollateralTokenAddress,
  WithDebtTokenAddress,
  WithFlashloanToken,
} from '@dma-library/types'

export type AaveCloseArgs = IBasePositionTransitionArgs<AAVETokens> & {
  positionType: PositionType
} & {
  shouldCloseToCollateral?: boolean
}
export type WithVersioning = {
  protocolVersion: AaveVersion
}

export type WithAaveValuesFromProtocol = {
  protocolValues: AaveValuesFromProtocol
}

export type AaveCloseArgsWithVersioning = AaveCloseArgs & WithVersioning
export type AaveCloseDependencies =
  | IPositionTransitionDependencies<AAVEStrategyAddresses>
  | IPositionTransitionDependencies<AAVEV3StrategyAddresses>

export type ExpandedAaveCloseArgs = AaveCloseArgs &
  WithVersioning &
  WithAaveValuesFromProtocol &
  WithCollateralTokenAddress &
  WithDebtTokenAddress &
  WithFlashloanToken
