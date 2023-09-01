import { OperationNames } from '@deploy-configurations/constants'
import { Delta, IBaseSimulatedTransition, IPosition, IRiskRatio, Swap } from '@domain'

import { ActionCall } from './action-call'
import { SwapData } from './swap-data'

/** @deprecated use ISimulationV2 instead */
export interface ISimulation {
  position: IPosition
  delta: Delta
}

export type WithSwapSimulation = {
  swap: SwapData & Swap
}

export type WithOptionalSwapSimulation = Partial<WithSwapSimulation>

export type WithMinConfigurableRiskRatio = {
  minConfigurableRiskRatio: IRiskRatio
}

/** @deprecated use ISimulation instead */
export type ISimulatedTransition = IBaseSimulatedTransition & {
  swap: SwapData & Swap
  minConfigurableRiskRatio: IRiskRatio
}

/** @deprecated use ISimulation instead */
export type ISimpleSimulatedTransition = Omit<
  ISimulatedTransition,
  'swap' | 'minConfigurableRiskRatio'
>

/** @deprecated use IStrategy instead */
export interface PositionTransition {
  transaction: {
    calls: ActionCall[]
    operationName: OperationNames
  }
  simulation: ISimulatedTransition
}

/** @deprecated use ISimulation instead */
export type ISimplePositionTransition = Omit<PositionTransition, 'simulation'> & {
  simulation: ISimpleSimulatedTransition
}

export interface IStrategy {
  transaction: {
    calls: ActionCall[]
    operationName: OperationNames
  }
  simulation: ISimulation
}

export type IMultiplyStrategy = IStrategy & {
  simulation: IStrategy['simulation'] & WithOptionalSwapSimulation
}
