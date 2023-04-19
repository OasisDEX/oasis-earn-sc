import { Address } from '@oasisdex/dma-deployments/types/address'
import { IPosition, IRiskRatio } from '@oasisdex/domain'
import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

import { PositionType } from './position-type'
import { SwapData } from './swap-data'

export interface IBasePositionTransitionArgs<Tokens> {
  slippage: BigNumber
  collateralToken: { symbol: Tokens; precision?: number }
  debtToken: { symbol: Tokens; precision?: number }
}

type WithDeposit = {
  depositedByUser?: {
    collateralInWei?: BigNumber
    debtInWei?: BigNumber
  }
}

type WithMultiple = {
  multiple: IRiskRatio
}

export type WithLockedCollateral = {
  collateralAmountLockedInProtocolInWei: BigNumber
}

export type WithWithdrawCollateral = {
  amountCollateralToWithdrawInBaseUnit: BigNumber
}

export type WithPaybackDebt = {
  amountDebtToPaybackInBaseUnit: BigNumber
}

export type WithBorrowDebt = {
  amountDebtToBorrowInBaseUnit: BigNumber
}

export type WithPositionType = {
  positionType: PositionType
}

export type WithDepositCollateral = {
  amountCollateralToDepositInBaseUnit: BigNumber
}

export interface IPositionTransitionArgs<Tokens>
  extends IBasePositionTransitionArgs<Tokens>,
    WithDeposit,
    WithMultiple {}

export interface IViewPositionParams<Tokens> {
  proxy: string
  collateralToken: { symbol: Tokens; precision?: number }
  debtToken: { symbol: Tokens; precision?: number }
}

export type WithDebtChange<Tokens> = {
  newDebtToken: { symbol: Tokens; precision?: number }
}

/**
 * We've add current Position into all strategy dependencies
 * It turned out that after opening and then closing a position there might be artifacts
 * Left in a position that make it difficult to re-open it
 */
export interface IPositionTransitionDependencies<Addresses> {
  addresses: Addresses
  provider: providers.Provider
  currentPosition: IPosition
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  proxy: Address
  user: Address
  isDPMProxy: boolean
}

export type IOpenPositionTransitionDependencies<Addresses> = Omit<
  IPositionTransitionDependencies<Addresses>,
  'currentPosition'
>

export type IOnlyDepositBorrowOpenPositionTransitionDependencies<Addresses> = Omit<
  IOpenPositionTransitionDependencies<Addresses>,
  'getSwapData'
>

export interface IViewPositionDependencies<Addresses> {
  addresses: Addresses
  provider: providers.Provider
}
