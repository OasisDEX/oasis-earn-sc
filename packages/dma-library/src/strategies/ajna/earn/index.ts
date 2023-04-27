import bucketPrices_ from './buckets.json'
import { depositAndAdjust } from './deposit-adjust'
import { open } from './open'
import { withdrawAndAdjust } from './withdraw-adjust'

export const bucketPrices = bucketPrices_

export const earn = {
  open,
  depositAndAdjust,
  withdrawAndAdjust,
}
