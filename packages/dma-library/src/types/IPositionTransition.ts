import { OperationNames } from '@oasisdex/dma-common/constants/operation-names'
import { IBaseSimulatedTransition, IRiskRatio, Swap } from '@oasisdex/domain/src'

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
