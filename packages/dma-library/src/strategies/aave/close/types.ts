import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import { AaveVersion } from '@dma-library/strategies'
import { AaveValuesFromProtocol } from '@dma-library/strategies/aave/close/get-values-from-protocol'
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

export type WithAaveValuesFromProtocol = {
  protocolValues: AaveValuesFromProtocol
}

export type WithFlashloanToken = {
  flashloanToken: { symbol: AAVETokens; precision: number; address: string }
}

export type WithCollateralTokenAddress = {
  collateralTokenAddress: string
}

export type WithDebtTokenAddress = {
  debtTokenAddress: string
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
