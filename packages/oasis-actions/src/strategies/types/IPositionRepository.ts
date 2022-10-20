import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

import { IBasePosition, IPosition } from '../../helpers/calculations/Position'
import { AAVETokens } from '../../operations/aave/tokens'
import { IPositionMutation } from './IPositionMutation'
import { SwapData } from './SwapData'

export interface IBasePositionMutationArgs<Tokens> {
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

export type WithLockedCollateral = {
  collateralAmountLockedInProtocolInWei: BigNumber
}

export interface IPositionMutationArgs<Tokens>
  extends IBasePositionMutationArgs<Tokens>,
    WithDeposit,
    WithMultiple {}

export interface IMutationDependencies<Addresses> {
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
