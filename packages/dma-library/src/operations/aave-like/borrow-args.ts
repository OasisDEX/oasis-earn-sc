import { Address } from '@deploy-configurations/types/address'
import BigNumber from 'bignumber.js'

export interface BorrowArgs {
  borrowToken: Address
  /* in the maximum precision (wei equivalent) form for the token */
  amount: BigNumber
  account: string
  user: string
  isEthToken: boolean
}
