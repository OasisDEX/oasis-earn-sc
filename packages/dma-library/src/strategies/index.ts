import { aave } from './aave'
import { ajna } from './ajna'
import buckets from './ajna/earn/buckets.json'
import { spark } from './spark'

export const strategies: {
  aave: typeof aave
  ajna: typeof ajna
  spark: typeof spark
} = {
  aave,
  ajna,
  spark,
}

export const ajnaBuckets = buckets
