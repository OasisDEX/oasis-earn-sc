import irmAbi from '@abis/external/protocols/morphoblue/irm.json'
import morphoAbi from '@abis/external/protocols/morphoblue/morpho.json'
import oracleAbi from '@abis/external/protocols/morphoblue/oracle.json'
import { normalizeValue } from '@dma-common/utils/common'
import { getMarketRate } from '@dma-library/strategies/morphoblue/validation'
import { LendingCumulativesData, MorphoBluePosition } from '@dma-library/types'
import { GetCumulativesData } from '@dma-library/views'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { ONE, TEN } from '../../../../dma-common/constants/numbers'
import type { Irm } from '../../../../dma-contracts/typechain/abis/external/protocols/morphoblue/Irm'
import type { Morpho } from '../../../../dma-contracts/typechain/abis/external/protocols/morphoblue/Morpho'
import type { Oracle } from '../../../../dma-contracts/typechain/abis/external/protocols/morphoblue/Oracle'

interface Args {
  proxyAddress: string
  collateralPriceUSD: BigNumber
  quotePriceUSD: BigNumber
  collateralPrecision: number
  quotePrecision: number
  marketId: string
}

export type MorphoCumulativesData = LendingCumulativesData

interface Dependencies {
  provider: ethers.providers.Provider
  morphoAddress: string
  getCumulatives: GetCumulativesData<MorphoCumulativesData>
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
  {
    proxyAddress,
    collateralPriceUSD,
    quotePriceUSD,
    marketId,
    collateralPrecision,
    quotePrecision,
  }: Args,
  { getCumulatives, morphoAddress, provider }: Dependencies,
): Promise<MorphoBluePosition> {
  const morpho = new ethers.Contract(morphoAddress, morphoAbi, provider) as any as Morpho

  const marketParams = await morpho.idToMarketParams(marketId)
  const market = await morpho.market(marketId)
  const positionParams = await morpho.position(marketId, proxyAddress)

  const totals = {
    totalSupplyAssets: new BigNumber(market.totalSupplyAssets.toString()).div(
      TEN.pow(quotePrecision),
    ),
    totalSupplyShares: new BigNumber(market.totalSupplyShares.toString()).div(TEN.pow(24)),
    totalBorrowAssets: new BigNumber(market.totalBorrowAssets.toString()).div(
      TEN.pow(quotePrecision),
    ),
    totalBorrowShares: new BigNumber(market.totalBorrowShares.toString()).div(TEN.pow(24)),
  }

  const oracle = new ethers.Contract(marketParams.oracle, oracleAbi, provider) as any as Oracle
  const irm = new ethers.Contract(marketParams.irm, irmAbi, provider) as any as Irm

  const price = await oracle.price()
  const rate = await irm.borrowRateView(marketParams, market)

  const apy = getMarketRate(rate.toString())

  const debtAmount = toAssetsDown(
    new BigNumber(positionParams.borrowShares.toString()),
    new BigNumber(market.totalBorrowAssets.toString()),
    new BigNumber(market.totalBorrowShares.toString()),
  )
    .integerValue()
    .div(TEN.pow(quotePrecision))
  const collateralAmount = new BigNumber(positionParams.collateral.toString()).div(
    TEN.pow(collateralPrecision),
  )

  const cumulatives = await getCumulatives(proxyAddress, marketId)

  const {
    borrowCumulativeWithdrawInCollateralToken,
    borrowCumulativeDepositInCollateralToken,
    borrowCumulativeFeesInCollateralToken,
  } = cumulatives

  const netValue = collateralAmount.times(collateralPriceUSD).minus(debtAmount.times(quotePriceUSD))

  const pnl = {
    withFees: normalizeValue(
      borrowCumulativeWithdrawInCollateralToken
        .plus(netValue.div(collateralPriceUSD))
        .minus(borrowCumulativeDepositInCollateralToken)
        .minus(borrowCumulativeFeesInCollateralToken)
        .div(borrowCumulativeDepositInCollateralToken),
    ),
    withoutFees: normalizeValue(
      borrowCumulativeWithdrawInCollateralToken
        .plus(netValue.div(collateralPriceUSD))
        .minus(borrowCumulativeDepositInCollateralToken)
        .div(borrowCumulativeDepositInCollateralToken),
    ),
    cumulatives,
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
    },
    {
      ...totals,
      lastUpdate: new BigNumber(market.lastUpdate.toString()),
      fee: new BigNumber(market.fee.toString()),
    },
    new BigNumber(price.toString()).div(TEN.pow(36 + quotePrecision - collateralPrecision)),
    apy,
    pnl,
  )
}
