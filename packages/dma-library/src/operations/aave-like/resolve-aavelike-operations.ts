import { AaveBorrowOperations, AaveMultiplyOperations, operations } from '@dma-library/operations'
import { SparkBorrowOperations, SparkMultiplyOperations } from '@dma-library/operations/spark'
import { PositionType } from '@dma-library/types'
import { AaveLikeProtocol } from '@dma-library/types/protocol'

type AaveProductTypes = PositionType

type ProtocolKeyConfig = {
  protocol: 'aave' | 'spark'
  type: 'borrow' | 'multiply'
  version?: 'v2' | 'v3'
}

const resolveProtocolKeyConfig = (
  protocol: AaveLikeProtocol,
  type: AaveProductTypes,
): ProtocolKeyConfig => {
  const aaveLikeProductType = type === 'Borrow' ? 'borrow' : 'multiply'
  switch (protocol) {
    case 'AAVE':
      return {
        protocol: 'aave',
        type: aaveLikeProductType,
        version: 'v2',
      }
    case 'AAVE_V3':
      return {
        protocol: 'aave',
        type: aaveLikeProductType,
        version: 'v3',
      }
    case 'Spark':
      return {
        protocol: 'spark',
        type: aaveLikeProductType,
      }
  }
}

export function isAaveOperation(op: any): op is AaveBorrowOperations | AaveMultiplyOperations {
  return op && ('v2' in op || 'v3' in op)
}

export function resolveAaveLikeBorrowOperations(
  protocolType: AaveLikeProtocol,
  positionType: PositionType,
): SparkBorrowOperations | AaveBorrowOperations['v2'] | AaveBorrowOperations['v3'] {
  const { protocol, type, version } = resolveProtocolKeyConfig(protocolType, positionType)

  if (protocol === 'aave' && !version) {
    throw new Error('Must specify version for Aave protocol')
  }

  if (type !== 'borrow') {
    throw new Error(`Invalid type ${type} for borrow based operation`)
  }

  const protocolOperations = operations[protocol]?.[type]
  if (!protocolOperations) {
    throw new Error(`No operations found for protocol ${protocol} and type ${type}`)
  }

  if (isAaveOperation(protocolOperations)) {
    if (!version) throw new Error('Must specify version for Aave protocol')
    return protocolOperations[version]
  }

  return protocolOperations
}

export function resolveAaveLikeMultiplyOperations(
  protocolType: AaveLikeProtocol,
  positionType: PositionType,
): SparkMultiplyOperations | AaveMultiplyOperations['v2'] | AaveMultiplyOperations['v3'] {
  const { protocol, type, version } = resolveProtocolKeyConfig(protocolType, positionType)

  if (protocol === 'aave' && !version) {
    throw new Error('Must specify version for Aave protocol')
  }

  // Note: Type can only be borrow or multiply (where Multiply covers Earn-Multiply positions also)
  if (type !== 'multiply') {
    throw new Error(`Invalid type ${type} for multiply based operation`)
  }

  const protocolOperations = operations[protocol]?.[type]
  if (!protocolOperations) {
    throw new Error(`No operations found for protocol ${protocol} and type ${type}`)
  }

  if (isAaveOperation(protocolOperations)) {
    if (!version) throw new Error('Must specify version for Aave protocol')
    return protocolOperations[version]
  }

  return protocolOperations
}
