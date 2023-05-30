import { Address } from '@deploy-configurations/types/address'
import BigNumber from 'bignumber.js'

export interface DepositSwapArgs {
  fee: number
  receiveAtLeast: BigNumber
  calldata: string
  collectFeeInFromToken: boolean
}

export interface DepositArgs {
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
