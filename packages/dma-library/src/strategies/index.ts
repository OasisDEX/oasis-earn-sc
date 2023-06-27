import { aave } from './aave'
import { ajna } from './ajna'
import buckets from './ajna/earn/buckets.json'

export { AaveVersion, getAaveTokenAddress } from './aave'

export const strategies: {
  aave: typeof aave
  ajna: typeof ajna
} = {
  aave,
  ajna,
}

export const ajnaBuckets = buckets
