import operationExecutorAbi from '@abis/system/contracts/core/OperationExecutor.sol/OperationExecutor.json'
import { CommonDMADependencies, IOperation } from '@dma-library/types'
import { ethers } from 'ethers'

export function encodeOperation(
  operation: IOperation,
  dependencies: CommonDMADependencies,
): string {
  const operationExecutor = new ethers.Contract(
    dependencies.operationExecutor,
    operationExecutorAbi,
    dependencies.provider,
  )
  return operationExecutor.interface.encodeFunctionData('executeOp', [
    operation.calls,
    operation.operationName,
  ])
}
