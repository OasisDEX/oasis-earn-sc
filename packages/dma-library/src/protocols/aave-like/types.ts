import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like'
import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

export type PriceResult = BigNumber | undefined
export type ReserveDataResult = any

export type SharedAaveLikeProtocolDataArgs = {
  collateralTokenAddress: string
  debtTokenAddress: string
  addresses: AaveLikeStrategyAddresses
  provider: providers.Provider
  flashloanTokenAddress?: string
  proxy?: string
}

export type AaveLikeProtocolData = {
  flashloanAssetPriceInEth: PriceResult
  debtTokenPriceInEth: PriceResult
  collateralTokenPriceInEth: PriceResult
  reserveDataForFlashloan: ReserveDataResult
  reserveDataForCollateral: ReserveDataResult
  reserveEModeCategory: number | undefined
  userReserveDataForDebtToken: any
  userReserveDataForCollateral: any
  eModeCategoryData: any
}
