import { ActionCall } from '../../actions/types/actionCall'
import { IBaseSimulatedTransition, Swap } from '../../helpers/calculations/Position'
import { IRiskRatio } from '../../helpers/calculations/RiskRatio'
import { OperationNames } from '../../helpers/constants'
import { SwapData } from './SwapData'

interface ISimulatedTransition extends IBaseSimulatedTransition {
  swap: SwapData & Swap
  minConfigurableRiskRatio: IRiskRatio
}

export interface IPositionTransition {
  transaction: {
    calls: ActionCall[]
    // operationName: OperationNames
    operationName: 'CUSTOM_OPERATION'
  }
  simulation: ISimulatedTransition
}
