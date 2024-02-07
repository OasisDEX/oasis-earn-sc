import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { AaveProtocolData } from '@dma-library/protocols'
import { AaveLikeTokens } from '@dma-library/types/aave-like'
import { AaveLikeProtocol } from '@dma-library/types/protocol'
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
  entryToken: { symbol: AaveLikeTokens; precision?: number }
}

export type WithAaveLikeEntryToken = {
  entryToken: { symbol: AaveLikeTokens; precision?: number }
}

export type WithAaveStrategyArgs = {
  collateralToken: { symbol: AaveLikeTokens; precision?: number }
  debtToken: { symbol: AaveLikeTokens; precision?: number }
  entryToken?: { symbol: AaveLikeTokens; precision?: number }
} & WithSlippage

type WithAaveLikeProtocolType = {
  protocolType: AaveLikeProtocol
}

export type WithAaveLikeStrategyArgs = {
  collateralToken: { symbol: AaveLikeTokens; precision?: number }
  debtToken: { symbol: AaveLikeTokens; precision?: number }
} & WithSlippage

export type WithAaveLikeBorrowStrategyArgs = {
  entryToken?: { symbol: AaveLikeTokens; precision?: number }
} & WithAaveLikeStrategyArgs

export type WithAaveLikeMultiplyStrategyArgs = WithAaveLikeBorrowStrategyArgs

export type WithCloseToCollateralFlag = {
  shouldCloseToCollateral?: boolean
}

export type WithProtocolData = {
  protocolData: AaveProtocolData
}

type WithSlippage = {
  slippage: BigNumber
}

export type WithDeposit = {
  depositedByUser?: {
    collateralInWei?: BigNumber
    debtInWei?: BigNumber
  }
}

export type WithMultiple = {
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

export interface IViewPositionParams<Tokens> {
  proxy: string
  collateralToken: { symbol: Tokens; precision?: number }
  debtToken: { symbol: Tokens; precision?: number }
}

export type WithDebtChange<Tokens> = {
  newDebtToken: { symbol: Tokens; precision?: number }
}

type SharedStrategyDependencies = {
  provider: providers.Provider
  currentPosition: IPosition
  proxy: Address
  user: Address
  network: Network
}

export type WithAaveLikeStrategyDependencies = {
  addresses: AaveLikeStrategyAddresses
} & SharedStrategyDependencies &
  WithAaveLikeProtocolType
export type WithAaveLikeMultiplyStrategyDependencies = WithAaveLikeStrategyDependencies &
  WithDPMFlag

export type WithDPMFlag = {
  isDPMProxy: boolean
}

export type WithGetSwap = {
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

export type WithOptionalGetSwap = Partial<WithGetSwap>

export interface WithViewPositionDependencies<Addresses> {
  addresses: Addresses
  provider: providers.Provider
}

export type WithFlashLoanArgs = {
  flashloan: {
    token: {
      symbol: string
      precision: number
      address: string
    }
  }
}
export type WithCollateralTokenAddress = {
  collateralTokenAddress: string
}
export type WithDebtTokenAddress = {
  debtTokenAddress: string
}

export type WithDebtCoverage = {
  debtCoverage: BigNumber
}
