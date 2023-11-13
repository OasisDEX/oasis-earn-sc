import { AaveOperations, aaveOperations } from './aave'
import { AjnaOperations, ajnaOperations } from './ajna'
import { SparkOperations, sparkOperations } from './spark'

export { AaveBorrowOperations, AaveMultiplyOperations } from './aave'
export { BorrowArgs, DepositArgs } from './aave-like'

const ajna = ajnaOperations
const spark = sparkOperations
const aave = aaveOperations

export const operations: {
  ajna: AjnaOperations
  aave: AaveOperations
  spark: SparkOperations
} = {
  aave,
  ajna,
  spark,
}

export {
  getAvailableRefinanceOperationsNames,
  getRefinanceOperation,
  getRefinanceOperationName,
} from './refinance'
