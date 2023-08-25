import { AaveOperations, aaveOperations } from '@dma-library/operations/aave'

import { AjnaOperations, ajnaOperations } from './ajna'
import { SparkOperations, sparkOperations } from './spark'

export { AdjustRiskDownArgs, AdjustRiskUpArgs } from './aave/v2'
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
