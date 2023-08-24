import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { AAVETokens } from '@dma-library/types/aave'
import { GetSwapData } from '@dma-library/types/common/get-swap-data'
import { IPosition, IRiskRatio } from '@domain'
import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

import { PositionType } from './position-type'
import { SwapData } from './swap-data'

/** @deprecated use WithAaveStrategyArgs instead */
export interface IBasePositionTransitionArgs<Tokens> {
  slippage: BigNumber
  collateralToken: { symbol: Tokens; precision?: number }
  debtToken: { symbol: Tokens; precision?: number }
}

export type WithAaveEntryToken = {
  entryToken: { symbol: AAVETokens; precision?: number }
}

export type WithAaveStrategyArgs = {
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
  getSwapData: GetSwapData
  proxy: Address
  user: Address
  isDPMProxy: boolean
  network: Network
}

type SharedStrategyDependencies = {
  provider: providers.Provider
  currentPosition: IPosition
  proxy: Address
  user: Address
  isDPMProxy: boolean
  network: Network
}
export type WithAaveStrategyDependencies = {
  addresses: AaveLikeStrategyAddresses
} & SharedStrategyDependencies

export type WithSwap = {
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
}

export type WithDebug = {
  debug: boolean
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

export type WithFlashloanToken = {
  flashloanToken: { symbol: AAVETokens; precision: number; address: string }
}
export type WithCollateralTokenAddress = {
  collateralTokenAddress: string
}
export type WithDebtTokenAddress = {
  debtTokenAddress: string
}
