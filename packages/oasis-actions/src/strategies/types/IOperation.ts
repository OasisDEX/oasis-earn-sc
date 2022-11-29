import { ActionCall } from '../../actions/types/actionCall'

export interface IOperation {
  calls: ActionCall[]
  // operationName: OperationNames
  operationName: 'CUSTOM_OPERATION'
}
