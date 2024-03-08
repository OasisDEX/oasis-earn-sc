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
  useUserEmode?: boolean
}

export type EModeCategoryData =
  | [number, number, number, string, string] & {
      ltv: number
      liquidationThreshold: number
      liquidationBonus: number
      priceSource: string
      label: string
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
  eModeCategoryData: EModeCategoryData | undefined
}
