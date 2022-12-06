import { Optional } from 'utility-types'

import { ActionCall } from '../../actions/types/actionCall'
import { IBaseSimulatedTransition, Swap } from '../../helpers/calculations/Position'
import { IRiskRatio } from '../../helpers/calculations/RiskRatio'
import { SwapData } from './SwapData'

interface ISimulatedTransition extends IBaseSimulatedTransition {
  swap?: SwapData & Swap
  minConfigurableRiskRatio?: IRiskRatio
}

export interface IPositionTransition {
  transaction: {
    calls: ActionCall[]
    // operationName: OperationNames
    operationName: 'CustomOperation'
  }
  simulation: ISimulatedTransition
}

export type IPositionTransitionWithOptionalSwap = Pick<IPositionTransition, 'transaction'> & {
  simulation: Optional<ISimulatedTransition, 'swap'>
}
