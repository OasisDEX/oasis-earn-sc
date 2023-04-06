import { IBaseSimulatedTransition, Swap } from '../domain/Position'
import { IRiskRatio } from '../domain/RiskRatio'
import { OperationNames } from '../utils/constants'
import { ActionCall } from './actionCall'
import { SwapData } from './SwapData'

export interface ISimulatedTransition extends IBaseSimulatedTransition {
  swap: SwapData & Swap
  minConfigurableRiskRatio: IRiskRatio
}

export type ISimpleSimulatedTransition = Omit<
  ISimulatedTransition,
  'swap' | 'minConfigurableRiskRatio'
>

export interface IPositionTransition {
  transaction: {
    calls: ActionCall[]
    operationName: OperationNames
  }
  simulation: ISimulatedTransition
}

export type ISimplePositionTransition = Omit<IPositionTransition, 'simulation'> & {
  simulation: ISimpleSimulatedTransition
}
