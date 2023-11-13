import { BorrowArgs } from '@dma-library/operations/aave-like'
import { DepositArgs, DepositSwapArgs } from '@dma-library/operations/aave-like/deposit-args'
import {
  WithPositionProduct,
  WithProxy,
  WithSwap,
  WithUserCollateral,
  WithUserDebt,
} from '@dma-library/types/operations'

// Swap
export type ToSwapArgsCastArgs = WithSwap

export type ToSwapArgsCast = (args: ToSwapArgsCastArgs) => DepositSwapArgs

export const toSwapArgs: ToSwapArgsCast = args => {
  const { fee, data, collectFeeFrom, receiveAtLeast } = args.swap

  return {
    fee,
    receiveAtLeast,
    calldata: data as string,
    collectFeeInFromToken: collectFeeFrom === 'sourceToken',
  }
}

// Deposit
export type ToDepositArgsCastArgs = WithProxy &
  WithPositionProduct &
  WithUserCollateral &
  WithUserDebt &
  WithSwap

export type ToDepositArgsCast = (args: ToDepositArgsCastArgs) => DepositArgs

export const toDepositArgs: ToDepositArgsCast = args => {
  const { proxy, position, user } = args

  return {
    entryTokenAddress: user.collateral.address,
    entryTokenIsEth: user.collateral.isEth,
    amountInBaseUnit: user.collateral.amount,
    depositToken: position.collateral.address,
    depositorAddress: proxy.owner,
    isSwapNeeded: user.collateral.address !== position.collateral.address,
    swapArgs: toSwapArgs(args),
  }
}

// Borrow
export type ToBorrowArgsCastArgs = WithProxy & WithPositionProduct & WithUserDebt

export type ToBorrowArgsCast = (args: ToBorrowArgsCastArgs) => BorrowArgs

export const toBorrowArgs: ToBorrowArgsCast = args => {
  const { proxy, position, user } = args

  return {
    borrowToken: position.debt.address,
    amount: user.amount,
    account: proxy.address,
    user: proxy.owner,
    isEthToken: position.debt.isEth,
  }
}
