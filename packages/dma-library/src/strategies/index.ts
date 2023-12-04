import { aave } from './aave'
import { ajna } from './ajna'
import buckets from './ajna/earn/buckets.json'
import { morphoblue } from './morphoblue'
import { spark } from './spark'

export const strategies: {
  aave: typeof aave
  ajna: typeof ajna
  spark: typeof spark
  morphoblue: typeof morphoblue
} = {
  aave,
  ajna,
  spark,
  morphoblue
}

export const ajnaBuckets = buckets
