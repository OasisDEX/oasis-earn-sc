import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

import { IBasePosition, IPosition } from '../../helpers/calculations/Position'
import { AAVETokens } from '../../operations/aave/tokens'
import { IPositionMutation } from './IPositionMutation'
import { SwapData } from './SwapData'

export interface IBasePositionMutationArgs<Tokens> {
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

export interface IPositionMutationArgs<Tokens>
  extends IBasePositionMutationArgs<Tokens>,
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
    args: IPositionMutationArgs<AAVETokens>,
    dependencies: IMutationDependencies<Addresses>,
  ) => Promise<IPositionMutation>
  close: (
    args: IBasePositionMutationArgs<AAVETokens> & WithLockedCollateral,
    dependencies: IMutationDependencies<Addresses> & WithPosition,
  ) => Promise<IPositionMutation>
  adjust: (
    args: IPositionMutationArgs<AAVETokens>,
    dependencies: IMutationDependencies<Addresses> & WithPosition,
  ) => Promise<IPositionMutation>
  view: (args: unknown) => Promise<IPosition> // Not being implemented yet
}
