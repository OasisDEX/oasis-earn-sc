import { AaveBorrowOperations, AaveMultiplyOperations, operations } from '@dma-library/operations'
import { SparkBorrowOperations, SparkMultiplyOperations } from '@dma-library/operations/spark'
import { PositionType } from '@dma-library/types'
import { AaveLikeProtocol } from '@dma-library/types/protocol'

type AaveProductTypes = PositionType

type ProtocolOperationKeyConfig = {
  protocol: 'aave' | 'spark'
  productCategory: 'borrow' | 'multiply'
  version?: 'v2' | 'v3'
}

/**
 * Maps a protocol label with its version and a product category to the corresponding
 * available operations for that protocol given the version and product category constraints.
 *
 * This function is essential for retrieving the correct DMA operations based on protocol and product category.
 * This is used to resolve the available operation(s) for a given protocol and product category
 *
 * @param protocolVersionLabel
 * @param productCategory
 */
const getProtocolOperationKeys = ({
  protocolVersionLabel,
  productCategory,
}: {
  protocolVersionLabel: AaveLikeProtocol
  productCategory: AaveProductTypes
}): ProtocolOperationKeyConfig => {
  const aaveLikeProductType = productCategory === 'Borrow' ? 'borrow' : 'multiply'
  switch (protocolVersionLabel) {
    case 'AAVE':
      return {
        protocol: 'aave',
        productCategory: aaveLikeProductType,
        version: 'v2',
      }
    case 'AAVE_V3':
      return {
        protocol: 'aave',
        productCategory: aaveLikeProductType,
        version: 'v3',
      }
    case 'Spark':
      return {
        protocol: 'spark',
        productCategory: aaveLikeProductType,
      }
  }
}

/**
 * Checks if the operation is an Aave operation based on presence of v2 or v3 keys
 * And based on value of protocol arg
 * @param op
 */
export function isAaveOperation(
  op: any,
  protocol: unknown,
): op is AaveBorrowOperations | AaveMultiplyOperations {
  return op && protocol === 'aave' && ('v2' in op || 'v3' in op)
}

/**
 * Gets the available Borrow-only operations for an aave-like protocol (eg Spark/AAVE)
 * based on product category and protocol version
 *
 * @param protocolType - eg AAVE_V3/AAVE/Spark
 * @param positionType - eg Borrow/Multiply/Earn
 */
export function resolveAaveLikeBorrowOperations(
  protocolType: AaveLikeProtocol,
  positionType: PositionType,
): SparkBorrowOperations | AaveBorrowOperations['v2'] | AaveBorrowOperations['v3'] {
  const { protocol, productCategory, version } = getProtocolOperationKeys({
    protocolVersionLabel: protocolType,
    productCategory: positionType,
  })
  validateBorrowProtocolOperationKeys(protocol, productCategory, version)

  const availableOperations = extractBorrowOperations({ protocol, productCategory, version })
  assertAvailableOperations(availableOperations, protocol, productCategory)

  return availableOperations
}

/**
 * Gets the available Multiply-only operations for an aave-like protocol (eg Spark/AAVE)
 * based on product category and protocol version
 *
 * @param protocolType - eg AAVE_V3/AAVE/Spark
 * @param positionType - eg Borrow/Multiply/Earn
 */
export function resolveAaveLikeMultiplyOperations(
  protocolType: AaveLikeProtocol,
  positionType: PositionType,
): SparkMultiplyOperations | AaveMultiplyOperations['v2'] | AaveMultiplyOperations['v3'] {
  const { protocol, productCategory, version } = getProtocolOperationKeys({
    protocolVersionLabel: protocolType,
    productCategory: positionType,
  })
  validateMultiplyProtocolOperationKeys(protocol, productCategory, version)

  const availableOperations = extractMultiplyOperations({ protocol, productCategory, version })
  assertAvailableOperations(availableOperations, protocol, productCategory)

  return availableOperations
}

function extractBorrowOperations({
  protocol,
  productCategory,
  version,
}: ProtocolOperationKeyConfig & { productCategory: 'borrow' }) {
  const availableOperations = operations[protocol]?.[productCategory]

  if (isAaveOperation(availableOperations, protocol)) {
    if (!version) throw new Error('Must specify version for Aave protocol')
    return availableOperations[version]
  }

  return availableOperations
}

function extractMultiplyOperations({
  protocol,
  productCategory,
  version,
}: ProtocolOperationKeyConfig & { productCategory: 'multiply' }) {
  const availableOperations = operations[protocol]?.[productCategory]

  if (isAaveOperation(availableOperations, protocol)) {
    if (!version) throw new Error('Must specify version for Aave protocol')
    return availableOperations[version]
  }

  return availableOperations
}

function validateMultiplyProtocolOperationKeys(
  protocol,
  productCategory,
  version,
): asserts productCategory is 'multiply' {
  // AAVE checks
  validateAaveProtocolOperationKeys(protocol, version)

  // Multiply checks
  if (productCategory !== 'multiply') {
    throw new Error(`Invalid type ${productCategory} for multiply based operation`)
  }
}

function validateBorrowProtocolOperationKeys(
  protocol,
  productCategory,
  version,
): asserts productCategory is 'borrow' {
  // AAVE checks
  validateAaveProtocolOperationKeys(protocol, version)

  // Borrow checks
  if (productCategory !== 'borrow') {
    throw new Error(`Invalid type ${productCategory} for borrow based operation`)
  }
}

/**
 * Validates that a version is present when working with AAVE protocol
 * @param protocol
 * @param version
 */
function validateAaveProtocolOperationKeys(protocol, version) {
  // AAVE checks
  if (protocol === 'aave' && !version) {
    throw new Error('Must specify version for Aave protocol')
  }
}

function assertAvailableOperations(
  availableOperations:
    | AaveBorrowOperations
    | SparkBorrowOperations
    | AaveMultiplyOperations
    | SparkMultiplyOperations
    | undefined,
  protocol: 'aave' | 'spark',
  productCategory: 'borrow' | 'multiply',
) {
  if (!availableOperations) {
    throw new Error(
      `No operations found for protocol ${protocol} and productCategory ${productCategory}`,
    )
  }
}
