import { ZERO } from '@dma-common/constants'
// import { LendingCumulativesData } from '@dma-library/types'
import { MakerPosition } from '@dma-library/types/maker/maker-position'
// import { GetCumulativesData } from '@dma-library/views'
import { BigNumber } from 'bignumber.js'
// import { ethers } from 'ethers'

interface Args {
  proxyAddress: string
  marketCollateralPriceUSD: BigNumber
  osmCurrentCollateralPriceUSD: BigNumber
  osmNextCollateralPriceUSD: BigNumber
  quotePriceUSD: BigNumber
  collateralPrecision: number
  quotePrecision: number
  marketId: string
}

// export type MakerCumulativesData = LendingCumulativesData

interface Dependencies {
  // provider: ethers.providers.Provider
  getPosition: () => Promise<any>
  // getCumulatives: GetCumulativesData<MakerCumulativesData>
}

export async function getMakerPosition(
  {
    proxyAddress,
    marketCollateralPriceUSD,
    osmCurrentCollateralPriceUSD,
    osmNextCollateralPriceUSD,
    quotePriceUSD,
  }: Args,
  { getPosition }: Dependencies,
): Promise<MakerPosition> {
  const position = await getPosition()

  // const morpho = new ethers.Contract(morphoAddress, morphoAbi, provider) as any as Morpho

  // const marketParams = await morpho.idToMarketParams(marketId)
  // const market = await morpho.market(marketId)
  // const positionParams = await morpho.position(marketId, proxyAddress)

  // const totals = {
  //   totalSupplyAssets: new BigNumber(market.totalSupplyAssets.toString()).div(
  //     TEN.pow(quotePrecision),
  //   ),
  //   totalSupplyShares: new BigNumber(market.totalSupplyShares.toString()).div(TEN.pow(24)),
  //   totalBorrowAssets: new BigNumber(market.totalBorrowAssets.toString()).div(
  //     TEN.pow(quotePrecision),
  //   ),
  //   totalBorrowShares: new BigNumber(market.totalBorrowShares.toString()).div(TEN.pow(24)),
  // }
  //
  // const oracle = new ethers.Contract(marketParams.oracle, oracleAbi, provider) as any as Oracle
  // const irm = new ethers.Contract(marketParams.irm, irmAbi, provider) as any as Irm
  //
  // const price = await oracle.price()
  // const rate = await irm.borrowRateView(marketParams, market)
  //
  // const apy = getMarketRate(rate.toString())
  //
  // const debtAmount = toAssetsDown(
  //   new BigNumber(positionParams.borrowShares.toString()),
  //   new BigNumber(market.totalBorrowAssets.toString()),
  //   new BigNumber(market.totalBorrowShares.toString()),
  // )
  //   .integerValue()
  //   .div(TEN.pow(quotePrecision))
  // const collateralAmount = new BigNumber(positionParams.collateral.toString()).div(
  //   TEN.pow(collateralPrecision),
  // )
  //
  // const cumulatives = await getCumulatives(proxyAddress, marketId)
  //
  // const {
  //   borrowCumulativeWithdrawInCollateralToken,
  //   borrowCumulativeDepositInCollateralToken,
  //   borrowCumulativeFeesInCollateralToken,
  // } = cumulatives
  //
  // const netValue = collateralAmount.times(collateralPriceUSD).minus(debtAmount.times(quotePriceUSD))
  //
  // const pnl = {
  //   withFees: normalizeValue(
  //     borrowCumulativeWithdrawInCollateralToken
  //       .plus(netValue.div(collateralPriceUSD))
  //       .minus(borrowCumulativeDepositInCollateralToken)
  //       .minus(borrowCumulativeFeesInCollateralToken)
  //       .div(borrowCumulativeDepositInCollateralToken),
  //   ),
  //   withoutFees: normalizeValue(
  //     borrowCumulativeWithdrawInCollateralToken
  //       .plus(netValue.div(collateralPriceUSD))
  //       .minus(borrowCumulativeDepositInCollateralToken)
  //       .div(borrowCumulativeDepositInCollateralToken),
  //   ),
  //   cumulatives,
  // }

  const collateralAmount = position.collateral ? new BigNumber(position.collateral) : ZERO
  const debtAmount = position.normalizedDebt
    ? new BigNumber(position.normalizedDebt).times(position.ilk.rate)
    : ZERO
  const rate = new BigNumber(Number(position.ilk.stabilityFee) - 1)

  return new MakerPosition(
    proxyAddress,
    collateralAmount,
    debtAmount,
    marketCollateralPriceUSD,
    osmCurrentCollateralPriceUSD,
    osmNextCollateralPriceUSD,
    quotePriceUSD,
    osmCurrentCollateralPriceUSD.div(quotePriceUSD),
    rate,
    {
      withFees: ZERO,
      withoutFees: ZERO,
      cumulatives: {
        borrowCumulativeDepositUSD: ZERO,
        borrowCumulativeDepositInQuoteToken: ZERO,
        borrowCumulativeDepositInCollateralToken: ZERO,
        borrowCumulativeWithdrawUSD: ZERO,
        borrowCumulativeWithdrawInQuoteToken: ZERO,
        borrowCumulativeWithdrawInCollateralToken: ZERO,
        borrowCumulativeCollateralDeposit: ZERO,
        borrowCumulativeCollateralWithdraw: ZERO,
        borrowCumulativeDebtDeposit: ZERO,
        borrowCumulativeDebtWithdraw: ZERO,
        borrowCumulativeFeesUSD: ZERO,
        borrowCumulativeFeesInQuoteToken: ZERO,
        borrowCumulativeFeesInCollateralToken: ZERO,
      },
    },
    new BigNumber(1 / (Number(position.ilk.liquidationRatio) / 10 ** 27)),
    new BigNumber(Number(position.ilk.liquidationPenalty) - 1),
  )
}
