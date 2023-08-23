import { AaveV2Operations, aaveV2Operations } from './aave/v2'
import { AaveV3Operations, aaveV3Operations } from './aave/v3'
import { AjnaOperations, ajnaOperations } from './ajna'

export { BorrowArgs, DepositArgs } from './aave/common'
export { AdjustRiskDownArgs, AdjustRiskUpArgs } from './aave/v2'
const aave = {
  v2: aaveV2Operations,
  v3: aaveV3Operations,
}

const ajna = ajnaOperations

export const operations: {
  ajna: AjnaOperations
  aave: { v2: AaveV2Operations; v3: AaveV3Operations }
} = {
  aave,
  ajna,
}
