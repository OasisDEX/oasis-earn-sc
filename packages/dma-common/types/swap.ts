import BigNumber from 'bignumber.js'

import { Address } from './address'

export interface Swap {
  fromTokenAddress: Address
  toTokenAddress: Address
  fromTokenAmount: BigNumber
  toTokenAmount: BigNumber
  minToTokenAmount: BigNumber
  exchangeCalldata: string | number
  collectFeeFrom: Address
  tokenFee: BigNumber
}
