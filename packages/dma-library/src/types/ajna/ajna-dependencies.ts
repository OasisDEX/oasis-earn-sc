import { Address } from '@deploy-configurations/types/address'
import { AjnaEarnPosition, AjnaPosition } from '@dma-library/types'
import { CommonDependencies, CommonDMADependencies } from '@dma-library/types/common'
import { GetSwapData } from '@dma-library/types/common/get-swap-data'
import { GetEarnData } from '@dma-library/views'
import { GetPoolData } from '@dma-library/views/ajna'
import { IRiskRatio } from '@domain'
import BigNumber from 'bignumber.js'

export interface AjnaCommonDependencies extends CommonDependencies {
  ajnaProxyActions: Address
  poolInfoAddress: Address
  WETH: Address
  getPoolData: GetPoolData
}

export type AjnaCommonDMADependencies = CommonDMADependencies & {
  poolInfoAddress: Address
  WETH: Address
  getPoolData: GetPoolData
  addresses: {
    DAI: Address
    ETH: Address
    WSTETH: Address
    USDC: Address
    WBTC: Address
  }
  getSwapData: GetSwapData
}

export interface AjnaOpenEarnDependencies extends AjnaCommonDependencies {
  getEarnData: GetEarnData
  rewardsManagerAddress: Address
}

export interface AjnaCommonPayload {
  dpmProxyAddress: string
  poolAddress: string
  collateralPrice: BigNumber
  collateralTokenPrecision: number
  quotePrice: BigNumber
  quoteTokenPrecision: number
}

export interface AjnaOpenBorrowPayload extends AjnaCommonPayload {
  quoteAmount: BigNumber
  collateralAmount: BigNumber
}

export interface AjnaBorrowPayload extends AjnaCommonPayload {
  position: AjnaPosition
  quoteAmount: BigNumber
  collateralAmount: BigNumber
}

export interface AjnaOpenEarnPayload extends AjnaCommonPayload {
  isStakingNft: boolean
  price: BigNumber
  quoteAmount: BigNumber
}

export interface AjnaMultiplyPayload extends AjnaCommonPayload {
  quoteTokenSymbol: string
  collateralTokenSymbol: string
  slippage: BigNumber
  user: Address
  collateralAmount$: BigNumber
  riskRatio: IRiskRatio
  position: AjnaPosition
}

export type AjnaOpenMultiplyPayload = Omit<AjnaMultiplyPayload, 'position'>
export type AjnaCloseMultiplyPayload = Omit<
  AjnaMultiplyPayload,
  'riskRatio' | 'collateralAmount$'
> & {
  shouldCloseToCollateral: boolean
}

export interface AjnaEarnPayload extends AjnaCommonPayload {
  isStakingNft: boolean
  price: BigNumber
  quoteAmount: BigNumber
  collateralAmount: BigNumber
  position: AjnaEarnPosition
}
