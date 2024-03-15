import { aave } from './aave'
import { ajna } from './ajna'
import buckets from './ajna/earn/buckets.json'
import { common } from './common'
import { morphoblue } from './morphoblue'
import { spark } from './spark'

export const strategies: {
  aave: typeof aave
  ajna: typeof ajna
  spark: typeof spark
  morphoblue: typeof morphoblue
  common: typeof common
} = {
  aave,
  ajna,
  spark,
  morphoblue,
  common,
}

export const ajnaBuckets = buckets
