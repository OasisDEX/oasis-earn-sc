import { aaveV2Operations } from './aave/v2'
import { aaveV3Operations } from './aave/v3'
import { AjnaOperations, ajnaOperations } from './ajna'

const aave = {
  v2: aaveV2Operations,
  v3: aaveV3Operations,
}

const ajna = ajnaOperations

export const operations: { ajna: AjnaOperations; aave: any } = {
  aave,
  ajna,
}
