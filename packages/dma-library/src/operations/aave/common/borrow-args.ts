import { Address } from '@deploy-configurations/types/address'
import BigNumber from 'bignumber.js'

export interface BorrowArgs {
  borrowToken: Address
  amountInBaseUnit: BigNumber
  account: string
  user: string
  isEthToken: boolean
}
