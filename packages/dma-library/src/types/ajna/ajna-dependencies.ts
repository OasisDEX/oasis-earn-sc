import { Address } from '@deploy-configurations/types/address'
import { AjnaEarnPosition, AjnaPosition, SwapData } from '@dma-library/types'
import { GetEarnData } from '@dma-library/views'
import { GetPoolData } from '@dma-library/views/ajna'
import { IRiskRatio } from '@domain'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export interface AjnaCommonDependencies {
  ajnaProxyActions: Address
  poolInfoAddress: Address
  provider: ethers.providers.Provider
  WETH: Address
  getPoolData: GetPoolData
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
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
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

export interface AjnaOpenMultiplyPayload extends AjnaCommonPayload {
  user: Address
  quoteTokenSymbol: string
  collateralTokenSymbol: string
  // In wei units or equivalent EG 1 USDC -> 1e6 or 1 ETH -> 1e18
  collateralAmount: BigNumber
  slippage: BigNumber
  riskRatio: IRiskRatio
}

export interface AjnaMultiplyPayload extends AjnaCommonPayload {
  position: AjnaPosition
  collateralAmount: BigNumber
  riskRatio: IRiskRatio
}

export interface AjnaEarnPayload extends AjnaCommonPayload {
  isStakingNft: boolean
  price: BigNumber
  quoteAmount: BigNumber
  collateralAmount: BigNumber
  position: AjnaEarnPosition
}
