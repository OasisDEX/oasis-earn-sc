import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

import { IBasePosition } from '../../helpers/calculations/Position'
import { AAVETokens } from '../../operations/aave/tokens'
import { IStrategy } from './IStrategy'
import { SwapData } from './SwapData'

export interface IBaseStrategyArgs<Tokens> {
  slippage: BigNumber
  collateralToken: Tokens
  debtToken: Tokens
}

type WithDeposit = {
  depositAmountInWei: BigNumber // in wei
}

type WithMultiple = {
  multiple: BigNumber
}

type WithLockedCollateral = {
  collateralAmountLockedInProtocolInWei: BigNumber
}

export interface IStrategyArgs<Tokens>
  extends IBaseStrategyArgs<Tokens>,
    WithDeposit,
    WithMultiple {}
export interface IStrategyCloseArgs<Tokens>
  extends IBaseStrategyArgs<Tokens>,
    WithLockedCollateral {}

export interface IStrategyDependencies<Addresses> {
  addresses: Addresses
  provider: providers.Provider
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  proxy: string
}

export type WithPosition = {
  position: IBasePosition
}

export interface IStrategyGenerator<Addresses> {
  open: (
    args: IStrategyArgs<AAVETokens>,
    dependencies: IStrategyDependencies<Addresses>,
  ) => Promise<IStrategy>
  close: (
    args: IStrategyCloseArgs<AAVETokens>,
    dependencies: IStrategyDependencies<Addresses> & WithPosition,
  ) => Promise<IStrategy>
  adjust: (
    args: IStrategyArgs<AAVETokens>,
    dependencies: IStrategyDependencies<Addresses> & WithPosition,
  ) => Promise<IStrategy>
  view: unknown // Not being implemented yet
}
