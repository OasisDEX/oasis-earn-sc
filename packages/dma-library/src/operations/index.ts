
import { AaveOperations, aaveOperations } from './aave'
import { AjnaOperations, ajnaOperations } from './ajna'
import { MorphoBlueOperations, morphoBlueOperations  } from './morphoblue'
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
} = {
  aave,
  ajna,
  spark,
  morphoblue,
}

export {
  getAvailableRefinanceOperationsNames,
  getRefinanceOperation,
  getRefinanceOperationDefinition,
  getRefinanceOperationName,
} from './refinance'
