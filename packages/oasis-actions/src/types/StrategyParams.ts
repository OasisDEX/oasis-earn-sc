import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

import { IPosition } from '../helpers/calculations/Position'
import { SwapData } from './SwapData'

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
  multiple: BigNumber
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

export interface IPositionTransitionArgs<Tokens>
  extends IBasePositionTransitionArgs<Tokens>,
    WithDeposit,
    WithMultiple {}

export type Address = string

export interface IViewPositionParams<Tokens, Protocols = void> {
  proxy: string
  collateralToken: { symbol: Tokens; precision?: number }
  debtToken: { symbol: Tokens; precision?: number }
  protocol?: Protocols
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

export interface IViewPositionDependencies<Addresses> {
  addresses: Addresses
  provider: providers.Provider
}
