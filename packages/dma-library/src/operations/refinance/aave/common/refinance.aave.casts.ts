import { BorrowArgs } from '@dma-library/operations/aave-like'
import { DepositArgs, DepositSwapArgs } from '@dma-library/operations/aave-like/deposit-args'
import {
  WithNewPosition,
  WithPositionStatus,
  WithProxy,
  WithSwap,
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
export type ToDepositArgsCastArgs = WithProxy & WithPositionStatus & WithNewPosition & WithSwap

export type ToDepositArgsCast = (args: ToDepositArgsCastArgs) => DepositArgs

export const toDepositArgs: ToDepositArgsCast = args => {
  const { proxy, position, newPosition } = args

  return {
    entryTokenAddress: position.collateral.address,
    entryTokenIsEth: position.collateral.isEth,
    amountInBaseUnit: position.collateral.amount,
    depositToken: position.collateral.address,
    depositorAddress: proxy.owner,
    isSwapNeeded: position.collateral.address !== newPosition.collateral.address,
    swapArgs: toSwapArgs(args),
  }
}

// Borrow
export type ToBorrowArgsCastArgs = WithProxy & WithPositionStatus & WithNewPosition

export type ToBorrowArgsCast = (args: ToBorrowArgsCastArgs) => BorrowArgs

export const toBorrowArgs: ToBorrowArgsCast = args => {
  const { proxy, position, newPosition } = args

  return {
    borrowToken: newPosition.debt.address,
    amount: position.collateral.amount,
    account: proxy.address,
    user: proxy.owner,
    isEthToken: position.debt.isEth,
  }
}
