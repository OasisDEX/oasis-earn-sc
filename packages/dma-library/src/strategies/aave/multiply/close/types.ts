import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import {
  AAVETokens,
  IBasePositionTransitionArgs,
  IPositionTransitionDependencies,
  PositionType,
  WithCollateralTokenAddress,
  WithDebtTokenAddress,
  WithFlashloanToken,
} from '@dma-library/types'
import { AaveVersion } from '@dma-library/types/aave'

import { AaveValuesFromProtocol } from './get-values-from-protocol'

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
export type AaveCloseDependencies = IPositionTransitionDependencies<AaveLikeStrategyAddresses>

export type ExpandedAaveCloseArgs = AaveCloseArgs &
  WithVersioning &
  WithAaveValuesFromProtocol &
  WithCollateralTokenAddress &
  WithDebtTokenAddress &
  WithFlashloanToken
