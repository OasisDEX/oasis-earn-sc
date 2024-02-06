import { Address } from '@oasisdex/deploy-configurations/types'
import BigNumber from 'bignumber.js'

export type BorrowArgs = {
  borrowToken: Address
  /**
   * The maximum precision (wei equivalent) form for the token
   * */
  amount: BigNumber
  account: string
  user: string
  isEthToken: boolean
}

export type WithBorrowArgs = BorrowArgs
