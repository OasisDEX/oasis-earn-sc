import { ActionCall } from '../../actions/types/actionCall'
import { OperationNames } from '../../helpers/constants'

export interface IOperation {
  calls: ActionCall[]
  // operationName: OperationNames
  operationName: 'CUSTOM_OPERATION'
}
