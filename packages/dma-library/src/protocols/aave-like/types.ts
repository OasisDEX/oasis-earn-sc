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
