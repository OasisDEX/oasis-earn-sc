import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'
import { SwapData } from '../types/SwapData'
import { IStrategyReturn } from './IStrategyReturn'
import { IBasePosition, Position } from '../../helpers/calculations/Position'

interface IStrategyArgs {
  depositAmountInWei: BigNumber // in wei
  slippage: BigNumber
  multiple: BigNumber
}

interface IStrategyDependencies<Addresses> {
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

type WithPosition = {
  position: IBasePosition
}
export interface IStrategy<Addresses> {
  open: (
    args: IStrategyArgs,
    dependencies: IStrategyDependencies<Addresses>,
  ) => Promise<IStrategyReturn>
  close: (
    args: IStrategyArgs,
    dependencies: IStrategyDependencies<Addresses> & WithPosition,
  ) => Promise<IStrategyReturn>
  adjust: (
    args: IStrategyArgs,
    dependencies: IStrategyDependencies<Addresses> & WithPosition,
  ) => Promise<IStrategyReturn>
  view: unknown // Not being implemented yet
}
