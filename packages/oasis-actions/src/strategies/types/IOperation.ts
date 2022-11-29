import { ActionCall } from '../../actions/types/actionCall'
import { OPERATION_NAMES } from '../../helpers/constants'

export interface IOperation {
  calls: ActionCall[]
  // operationName: OperationNames
  operationName: typeof OPERATION_NAMES.common.CUSTOM_OPERATION
}
