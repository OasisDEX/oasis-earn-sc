import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

import { IBasePosition, IPosition } from '../../helpers/calculations/Position'
import { AAVETokens } from '../../operations/aave/tokens'
import { IPositionTransition } from './IPositionTransition'
import { SwapData } from './SwapData'

export interface IBasePositionTransitionArgs<Tokens> {
  slippage: BigNumber
  collateralToken: { symbol: Tokens; precision?: number }
  debtToken: { symbol: Tokens; precision?: number }
  collectSwapFeeFrom?: 'sourceToken' | 'targetToken'
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

export interface IPositionTransitionArgs<Tokens>
  extends IBasePositionTransitionArgs<Tokens>,
    WithDeposit,
    WithMultiple {}

export type Address = string

export interface IMutationDependencies<Addresses> {
  addresses: Addresses
  provider: providers.Provider
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  proxy: Address
  user: Address
}

export type WithPosition = {
  position: IBasePosition
}

export interface IPositionRepository<Addresses> {
  open: (
    args: IPositionTransitionArgs<AAVETokens>,
    dependencies: IMutationDependencies<Addresses>,
  ) => Promise<IPositionTransition>
  close: (
    args: IBasePositionTransitionArgs<AAVETokens> & WithLockedCollateral,
    dependencies: IMutationDependencies<Addresses> & WithPosition,
  ) => Promise<IPositionTransition>
  adjust: (
    args: IPositionTransitionArgs<AAVETokens>,
    dependencies: IMutationDependencies<Addresses> & WithPosition,
  ) => Promise<IPositionTransition>
  view: (args: unknown) => Promise<IPosition> // Not being implemented yet
}
