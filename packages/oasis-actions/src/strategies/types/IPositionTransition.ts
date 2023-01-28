import { ActionCall } from '../../actions/types/actionCall'
import { IBaseSimulatedTransition, Swap } from '../../helpers/calculations/Position'
import { IRiskRatio } from '../../helpers/calculations/RiskRatio'
import { OperationNames } from '../../helpers/constants'
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
