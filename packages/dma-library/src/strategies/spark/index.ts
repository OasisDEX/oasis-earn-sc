import { SparkDepositBorrow } from '@dma-library/strategies/spark/borrow/deposit-borrow/types'

import { depositBorrow as sparkDepositBorrow } from './borrow/deposit-borrow'

export const spark: {
  depositBorrow: SparkDepositBorrow
} = {
  depositBorrow: sparkDepositBorrow,
}
