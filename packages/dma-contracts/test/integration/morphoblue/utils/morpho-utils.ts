import { convertAmount } from '@dma-library/utils/price-utils'
import {
  MorphoLLTVPrecision,
  MorphoMarketInfo,
  MorphoPricePrecision,
  MorphoSystem,
} from '@morpho-blue'
import { BigNumber } from 'ethers'

import { mulDivDown, toSharesUp } from './shares-library'

export type MorphoMarketStatus = {
  totalSupplyAssets: BigNumber
  totalSupplyShares: BigNumber
  totalBorrowAssets: BigNumber
  totalBorrowShares: BigNumber
  lastUpdate: BigNumber
  fee: BigNumber
}

export type MorphoMarketPosition = {
  supplyShares: BigNumber
  borrowShares: BigNumber
  collateral: BigNumber
}

export async function getMaxBorrowableAmount(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
  marketPosition: MorphoMarketPosition,
): Promise<BigNumber> {
  const oracle = morphoSystem.oraclesDeployment[market.loanToken][market.collateralToken]
  const priceLoanPerCollateral = await oracle.contract.price()

  const collateralInLoanToken = mulDivDown(
    marketPosition.collateral,
    priceLoanPerCollateral,
    BigNumber.from(10).pow(MorphoPricePrecision),
  )

  const maxBorrowAmount = mulDivDown(
    collateralInLoanToken,
    market.solidityParams.lltv as BigNumber,
    BigNumber.from(10).pow(MorphoLLTVPrecision),
  )

  return maxBorrowAmount
}

export async function getMaxSupplyCollateral(
  morphoSystem: MorphoSystem,
  market: MorphoMarketInfo,
  marketStatus: MorphoMarketStatus,
): Promise<BigNumber> {
  const oracle = morphoSystem.oraclesDeployment[market.loanToken][market.collateralToken]
  const priceLoanPerCollateral = await oracle.contract.price()
  const priceFactor = BigNumber.from(10).pow(MorphoPricePrecision)
  const lltvFactor = BigNumber.from(10).pow(MorphoLLTVPrecision)

  // (Total Supply in Loan Assets) / (Price of Collateral in Loan Assets)
  const loanAmountInCollateral = marketStatus.totalSupplyAssets
    .mul(priceFactor)
    .div(priceLoanPerCollateral)

  // (Total Supply in Collateral Assets) / (LLTV)
  const maximumCollateralToSupply = loanAmountInCollateral
    .mul(lltvFactor)
    .div(market.solidityParams.lltv as BigNumber)

  return maximumCollateralToSupply
}

export function calculateShares(
  marketStatus: MorphoMarketStatus,
  borrowAmount: BigNumber,
): BigNumber {
  return toSharesUp(borrowAmount, marketStatus.totalBorrowAssets, marketStatus.totalBorrowShares)
}
