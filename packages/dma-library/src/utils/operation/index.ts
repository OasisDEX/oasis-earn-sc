import operationExecutorAbi from '@abis/system/contracts/core/OperationExecutor.sol/OperationExecutor.json'
import { IOperation } from '@dma-library/types'
import { CommonDMADependencies } from '@dma-library/types/ajna/ajna-dependencies'
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
