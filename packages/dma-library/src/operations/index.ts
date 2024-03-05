import { AaveOperations, aaveOperations } from './aave'
import { AjnaOperations, ajnaOperations } from './ajna'
import { Erc4626Operations, erc4626Operations } from './common'
import { MorphoBlueOperations, morphoBlueOperations } from './morphoblue'
import { SparkOperations, sparkOperations } from './spark'

export { AaveBorrowOperations, AaveMultiplyOperations } from './aave'
export { BorrowArgs, DepositArgs } from './aave-like'

const ajna = ajnaOperations
const spark = sparkOperations
const aave = aaveOperations
const morphoblue = morphoBlueOperations

export const operations: {
  ajna: AjnaOperations
  aave: AaveOperations
  spark: SparkOperations
  morphoblue: MorphoBlueOperations
  erc4626Operations: Erc4626Operations
} = {
  aave,
  ajna,
  spark,
  morphoblue,
  erc4626Operations,
}

export {
  getAvailableRefinanceOperationsNames,
  getRefinanceOperation,
  getRefinanceOperationDefinition,
  getRefinanceOperationName,
} from './refinance'
