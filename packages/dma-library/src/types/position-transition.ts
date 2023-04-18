import { OperationNames } from '@oasisdex/dma-common/constants/operation-names'
import { IBaseSimulatedTransition, IRiskRatio, Swap } from '@oasisdex/domain/src'

import { ActionCall } from './action-call'
import { SwapData } from './swap-data'

export interface ISimulatedTransition extends IBaseSimulatedTransition {
  swap: SwapData & Swap
  minConfigurableRiskRatio: IRiskRatio
}

export type ISimpleSimulatedTransition = Omit<
  ISimulatedTransition,
  'swap' | 'minConfigurableRiskRatio'
>

export interface PositionTransition {
  transaction: {
    calls: ActionCall[]
    operationName: OperationNames
  }
  simulation: ISimulatedTransition
}

export type ISimplePositionTransition = Omit<PositionTransition, 'simulation'> & {
  simulation: ISimpleSimulatedTransition
}
