import { OperationNames } from '../helpers/constants'
import { ActionCall } from './actionCall'

export interface IOperation {
  calls: ActionCall[]
  operationName: OperationNames
}
