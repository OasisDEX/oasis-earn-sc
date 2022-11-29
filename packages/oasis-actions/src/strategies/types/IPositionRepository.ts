import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

import { IPosition } from '../../helpers/calculations/Position'
import { AAVETokens, TokenDef } from '../../operations/aave/tokens'
import { IPositionTransition, IPositionTransitionWithOptionalSwap } from './IPositionTransition'
import { SwapData } from './SwapData'

export interface IBasePositionTransitionArgs<Tokens> {
  slippage: BigNumber
  collateralToken: TokenDef<Tokens>
  debtToken: TokenDef<Tokens>
  collectSwapFeeFrom?: 'sourceToken' | 'targetToken'
}

export type WithDeposit = {
  depositedByUser?: {
    collateralInWei?: BigNumber
    debtInWei?: BigNumber
  }
}

export type WithDifferentEntryToken<Tokens> = {
  entryToken: TokenDef<Tokens>
}

type WithMultiple = {
  multiple: BigNumber
}

export type WithLockedCollateral = {
  collateralAmountLockedInProtocolInWei: BigNumber
}

export interface IPositionTransitionArgs<Tokens>
  extends IBasePositionTransitionArgs<Tokens>,
    WithDeposit,
    WithMultiple {}

export type Address = string

export interface IViewPositionParams<Tokens> {
  proxy: string
  collateralToken: TokenDef<Tokens>
  debtToken: TokenDef<Tokens>
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
}

export interface IViewPositionDependencies<Addresses> {
  addresses: Addresses
  provider: providers.Provider
}

export interface IPositionRepository<Addresses> {
  open: (
    args: IPositionTransitionArgs<AAVETokens>,
    dependencies: IPositionTransitionDependencies<Addresses>,
  ) => Promise<IPositionTransition>
  close: (
    args: IBasePositionTransitionArgs<AAVETokens> & WithLockedCollateral,
    dependencies: IPositionTransitionDependencies<Addresses>,
  ) => Promise<IPositionTransition>
  adjust: (
    args: IPositionTransitionArgs<AAVETokens>,
    dependencies: IPositionTransitionDependencies<Addresses>,
  ) => Promise<IPositionTransition>
  view: (
    args: IViewPositionParams<AAVETokens>,
    dependencies: IViewPositionDependencies<Addresses>,
  ) => Promise<IPosition>
  deposit: (
    args: IBasePositionTransitionArgs<AAVETokens> &
      WithDeposit &
      WithDifferentEntryToken<AAVETokens>,
    dependencies: IPositionTransitionDependencies<Addresses>,
  ) => Promise<IPositionTransitionWithOptionalSwap>
}
