import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import { AaveLikeTokens, IViewPositionParams } from '@dma-library/types'
import { AaveVersion } from '@dma-library/types/aave'
import * as StrategyParams from '@dma-library/types/strategy-params'
import BigNumber from 'bignumber.js'

export type AaveGetCurrentPositionArgs = IViewPositionParams<AaveLikeTokens>
export type AaveV2GetCurrentPositionDependencies =
  StrategyParams.WithViewPositionDependencies<AaveLikeStrategyAddresses> & {
    protocolVersion: AaveVersion.v2
  }
export type AaveV3GetCurrentPositionDependencies =
  StrategyParams.WithViewPositionDependencies<AaveLikeStrategyAddresses> & {
    protocolVersion: AaveVersion.v3
  }

type AaveV2ReserveDataReply = {
  availableLiquidity: BigNumber
  totalStableDebt: BigNumber
  totalVariableDebt: BigNumber
  liquidityRate: BigNumber
  variableBorrowRate: BigNumber
  stableBorrowRate: BigNumber
  averageStableBorrowRate: BigNumber
  liquidityIndex: BigNumber
  variableBorrowIndex: BigNumber
  lastUpdateTimestamp: BigNumber
}

type AaveV3ReserveDataReply = {
  availableLiquidity: BigNumber
  unbacked: BigNumber
  accruedToTreasuryScaled: BigNumber
  totalAToken: BigNumber
  totalToken: BigNumber
  totalStableDebt: BigNumber
  totalVariableDebt: BigNumber
  liquidityRate: BigNumber
  variableBorrowRate: BigNumber
  stableBorrowRate: BigNumber
  averageStableBorrowRate: BigNumber
  liquidityIndex: BigNumber
  variableBorrowIndex: BigNumber
  lastUpdateTimestamp: BigNumber
}

type SparkV3ReserveDataReply = AaveV3ReserveDataReply

export type ReserveDataReply =
  | AaveV2ReserveDataReply
  | AaveV3ReserveDataReply
  | SparkV3ReserveDataReply

export type AaveLikeCumulativeData = {
  cumulativeDepositUSD: BigNumber
  cumulativeDepositInQuoteToken: BigNumber
  cumulativeDepositInCollateralToken: BigNumber
  cumulativeWithdrawUSD: BigNumber
  cumulativeWithdrawInQuoteToken: BigNumber
  cumulativeWithdrawInCollateralToken: BigNumber
  cumulativeFeesUSD: BigNumber
  cumulativeFeesInQuoteToken: BigNumber
  cumulativeFeesInCollateralToken: BigNumber
}

export interface AaveLikeReserveConfigurationData {
  ltv: BigNumber
  liquidationThreshold: BigNumber
  liquidationBonus: BigNumber
}

export interface AaveLikeReserveData {
  tokenAddress: string
  variableDebtAddress: string
  availableLiquidity: BigNumber
  variableBorrowRate: BigNumber
  liquidityRate: BigNumber
  caps: {
    borrow: BigNumber
    supply: BigNumber
  }
  totalDebt: BigNumber
  totalSupply: BigNumber
  availableToBorrow: BigNumber
  availableToSupply: BigNumber
}

export type ReserveData = {
  collateral: AaveLikeReserveData
  debt: AaveLikeReserveData
}
