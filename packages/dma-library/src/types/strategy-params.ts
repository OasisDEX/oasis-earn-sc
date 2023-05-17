import { Address } from '@deploy-configurations/types/address'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import { AAVETokens } from '@dma-library/types/aave'
import { IPosition, IRiskRatio } from '@domain'
import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

import { PositionType } from './position-type'
import { SwapData } from './swap-data'

/** @deprecated use WithAaveTransitionArgs instead */
export interface IBasePositionTransitionArgs<Tokens> {
  slippage: BigNumber
  collateralToken: { symbol: Tokens; precision?: number }
  debtToken: { symbol: Tokens; precision?: number }
}

export type WithAaveEntryToken = {
  entryToken: { symbol: AAVETokens; precision?: number }
}

export type WithAaveTransitionArgs = {
  collateralToken: { symbol: AAVETokens; precision?: number }
  debtToken: { symbol: AAVETokens; precision?: number }
  entryToken?: { symbol: AAVETokens; precision?: number }
} & WithSlippage

type WithSlippage = {
  slippage: BigNumber
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

/** @deprecated compose strategy args instead */
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

/** @deprecated See SharedStrategyDependencies and create your own */
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

type SharedStrategyDependencies = {
  provider: providers.Provider
  currentPosition: IPosition
  proxy: Address
  user: Address
}
export type WithAaveV2StrategyDependencies = {
  addresses: AAVEStrategyAddresses
} & SharedStrategyDependencies

export type WithAaveV3StrategyDependencies = {
  addresses: AAVEV3StrategyAddresses
} & SharedStrategyDependencies

export type WithSwap = {
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
}

export type WithOptionalSwap = Partial<WithSwap>

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
