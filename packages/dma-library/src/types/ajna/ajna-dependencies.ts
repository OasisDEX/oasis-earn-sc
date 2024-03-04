import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { AjnaEarnPosition, AjnaPosition } from '@dma-library/types'
import { GetSwapData } from '@dma-library/types/common'
import { GetEarnData } from '@dma-library/views'
import { AjnaCumulativesData, GetCumulativesData, GetPoolData } from '@dma-library/views/ajna'
import { IRiskRatio } from '@domain'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export interface AjnaCommonDependencies {
  ajnaProxyActions: Address
  poolInfoAddress: Address
  provider: ethers.providers.Provider
  WETH: Address
  getPoolData: GetPoolData
  getCumulatives: GetCumulativesData<AjnaCumulativesData>
  network: Network
}

export type AjnaCommonDMADependencies = Omit<AjnaCommonDependencies, 'ajnaProxyActions'> & {
  operationExecutor: Address
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
}

export interface AjnaCommonPayload {
  dpmProxyAddress: string
  poolAddress: string
  collateralPrice: BigNumber
  collateralTokenPrecision: number
  quotePrice: BigNumber
  quoteTokenPrecision: number
  collateralToken: string
  quoteToken: string
}

export interface AjnaOpenBorrowPayload extends AjnaCommonPayload {
  quoteAmount: BigNumber
  collateralAmount: BigNumber
}

export interface AjnaBorrowPayload extends AjnaCommonPayload {
  position: AjnaPosition
  quoteAmount: BigNumber
  collateralAmount: BigNumber
  // Repay method doesn't stamp loan by default
  // this parameter is used to force restamp only if it makes sense
  // from user perspective
  stamploanEnabled?: boolean
}

export interface AjnaOpenEarnPayload extends AjnaCommonPayload {
  price: BigNumber
  quoteAmount: BigNumber
}

export interface AjnaMultiplyPayload extends AjnaCommonPayload {
  quoteTokenSymbol: string
  collateralTokenSymbol: string
  slippage: BigNumber
  user: Address
  collateralAmount: BigNumber
  riskRatio: IRiskRatio
  position: AjnaPosition
}

export type AjnaOpenMultiplyPayload = Omit<AjnaMultiplyPayload, 'position'>
export type AjnaCloseMultiplyPayload = Omit<
  AjnaMultiplyPayload,
  'riskRatio' | 'collateralAmount'
> & {
  shouldCloseToCollateral: boolean
}

export interface AjnaEarnPayload extends AjnaCommonPayload {
  price: BigNumber
  quoteAmount: BigNumber
  collateralAmount: BigNumber
  position: AjnaEarnPosition
}
