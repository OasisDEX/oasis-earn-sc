import { IOperation } from '@dma-library/types'

export function buildTransaction(operation: IOperation) {
  return {
    calls: operation.calls,
    operationName: operation.operationName,
  }
}
