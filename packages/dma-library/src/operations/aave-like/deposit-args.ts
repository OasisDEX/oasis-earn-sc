import { Address } from '@deploy-configurations/types/address'
import BigNumber from 'bignumber.js'

import type { SwapFeeType } from '../../types'

export type DepositSwapArgs = {
  fee: number
  feeType?: SwapFeeType
  receiveAtLeast: BigNumber
  calldata: string
  collectFeeInFromToken: boolean
}

export type DepositArgs = {
  // - either for a swap where the `entryToken` will be exchanged for the `depositToken`
  // - or it will be directly deposited in the protocol
  entryTokenAddress: Address
  entryTokenIsEth: boolean
  // - either used for a swap if `entryToken` is swapped for `depositToken`
  // - or it will be directly deposited in the protocol
  amountInBaseUnit: BigNumber
  depositToken: Address
  // Used to pull tokens from if ERC20 is used in the deposit
  depositorAddress: Address
  isSwapNeeded: boolean
  swapArgs?: DepositSwapArgs
}

export type WithDepositArgs = DepositArgs
