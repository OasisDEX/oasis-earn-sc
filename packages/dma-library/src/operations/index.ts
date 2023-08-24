import { AaveV2Operations, aaveV2Operations } from './aave/v2'
import { AaveV3Operations, aaveV3Operations } from './aave/v3'
import { AjnaOperations, ajnaOperations } from './ajna'
import { SparkOperations, sparkOperations } from './spark'

export { AdjustRiskDownArgs, AdjustRiskUpArgs } from './aave/v2'
export { BorrowArgs, DepositArgs } from './aave-like'
const aave = {
  v2: aaveV2Operations,
  v3: aaveV3Operations,
}

const ajna = ajnaOperations
const spark = sparkOperations

export const operations: {
  ajna: AjnaOperations
  aave: { v2: AaveV2Operations; v3: AaveV3Operations }
  spark: SparkOperations
} = {
  aave,
  ajna,
  spark,
}
