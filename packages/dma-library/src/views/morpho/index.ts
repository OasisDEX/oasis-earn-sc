import { MorphoBluePosition } from '@dma-library/types'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { Morpho__factory } from "@typechain/factories/abis/external/protocols/morphoblue/Morpho__factory"
import { Oracle__factory } from "@typechain/factories/abis/external/protocols/morphoblue/Oracle__factory"
import { Irm__factory } from "@typechain/factories/abis/external/protocols/morphoblue/Irm__factory"
import { ONE, TEN } from '../../../../dma-common/constants/numbers'

interface Args {
  proxyAddress: string
  collateralPriceUSD: BigNumber
  quotePriceUSD: BigNumber
  collateralPrecision: number
  quotePrecision: number
  marketId: string
}

export interface GetMorphoCumulativesData {
  (): Promise<{
    borrowCumulativeDepositUSD: BigNumber
    borrowCumulativeFeesUSD: BigNumber
    borrowCumulativeWithdrawUSD: BigNumber
  }>
}

interface Dependencies {
  provider: ethers.providers.Provider
  morphoAddress: string
  getCumulatives: GetMorphoCumulativesData
}

const VIRTUAL_SHARES = TEN.pow(6)
const VIRTUAL_ASSETS = ONE

function mulDivDown(x: BigNumber, y: BigNumber, d: BigNumber): BigNumber {
  return x.times(y).div(d)
}

function toAssetsDown(
  shares: BigNumber,
  totalAssets: BigNumber,
  totalShares: BigNumber,
): BigNumber {
  return mulDivDown(shares, totalAssets.plus(VIRTUAL_ASSETS), totalShares.plus(VIRTUAL_SHARES))
}

export async function getMorphoPosition(
  { proxyAddress, collateralPriceUSD, quotePriceUSD, marketId, collateralPrecision, quotePrecision }: Args,
  { getCumulatives, morphoAddress, provider }: Dependencies,
): Promise<MorphoBluePosition> {

  const morpho = Morpho__factory.connect(morphoAddress, provider)

  const marketParams = await morpho.idToMarketParams(marketId)
  const market = await morpho.market(marketId)
  const positionParams = await morpho.position(marketId, proxyAddress)

  const totals = {
    totalSupplyAssets: new BigNumber(market.totalSupplyAssets.toString()).div(TEN.pow(18)),
    totalSupplyShares: new BigNumber(market.totalSupplyShares.toString()).div(TEN.pow(24)),
    totalBorrowAssets: new BigNumber(market.totalBorrowAssets.toString()).div(TEN.pow(18)),
    totalBorrowShares: new BigNumber(market.totalBorrowShares.toString()).div(TEN.pow(24)),
  }

  const oracle = Oracle__factory.connect(marketParams.oracle, provider)
  const irm = Irm__factory.connect(marketParams.irm, provider)

  const price = await oracle.price()
  const rate = await irm.borrowRateView(marketParams, market)

  const debtAmount = toAssetsDown(
    new BigNumber(positionParams.borrowShares.toString()),
    new BigNumber(market.totalBorrowAssets.toString()),
    new BigNumber(market.totalBorrowShares.toString())
  ).integerValue().div( TEN.pow(quotePrecision))
  const collateralAmount = new BigNumber(positionParams.collateral.toString()).div(TEN.pow(collateralPrecision))

  const { borrowCumulativeWithdrawUSD, borrowCumulativeFeesUSD, borrowCumulativeDepositUSD } =
    await getCumulatives()

  const netValue = collateralAmount.times(collateralPriceUSD).minus(debtAmount.times(quotePriceUSD))

  const pnl = {
    withFees: borrowCumulativeWithdrawUSD
      .plus(netValue)
      .minus(borrowCumulativeFeesUSD)
      .minus(borrowCumulativeDepositUSD)
      .div(borrowCumulativeDepositUSD),
    withoutFees: borrowCumulativeWithdrawUSD
      .plus(netValue)
      .minus(borrowCumulativeDepositUSD)
      .div(borrowCumulativeDepositUSD),
  }

  return new MorphoBluePosition(
    proxyAddress,
    collateralAmount,
    debtAmount,
    collateralPriceUSD,
    quotePriceUSD,
    {
      id: marketId,
      loanToken: marketParams.loanToken,
      collateralToken: marketParams.collateralToken,
      oracle: marketParams.oracle,
      irm: marketParams.irm,
      lltv: new BigNumber(marketParams.lltv.toString()).div(TEN.pow(18)),
    }, {
      ...totals,
      lastUpdate: new BigNumber(market.lastUpdate.toString()),
      fee: new BigNumber(market.fee.toString()),
    },
    new BigNumber(price.toString()).div(TEN.pow(36 + quotePrecision - collateralPrecision)),
    new BigNumber(rate.toString()).div(TEN.pow(36)),
    pnl,
  )
}
