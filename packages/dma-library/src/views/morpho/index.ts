import { MorphoBluePosition } from '@dma-library/types'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import morphoblueAbi from '@abis/external/protocols/morphoblue/morpho.json'
import oracleAbi from '@abis/external/protocols/morphoblue/oracle.json'
import irmAbi from '@abis/external/protocols/morphoblue/irm.json'

import type { Morpho } from '@oasisdex/abis/types/ethers-contracts/protocols/morphoblue'
import { Oracle } from '@oasisdex/abis/types/ethers-contracts/protocols/morphoblue/Oracle'
import { Irm } from '@oasisdex/abis/types/ethers-contracts/protocols/morphoblue/Irm'
import { TEN } from '../../../../dma-common/constants/numbers'

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

export async function getMorphoPosition(
  { proxyAddress, collateralPriceUSD, quotePriceUSD, marketId, collateralPrecision, quotePrecision }: Args,
  { getCumulatives, morphoAddress, provider }: Dependencies,
): Promise<MorphoBluePosition> {

  const morpho = new ethers.Contract(morphoAddress, morphoblueAbi, provider) as any as Morpho

  const marketParams = await morpho.idToMarketParams(marketId)
  const market = await morpho.market(marketId)
  const positionParams = await morpho.position(marketId, proxyAddress)

  const oracle = new ethers.Contract(marketParams.oracle, oracleAbi, provider) as any as Oracle
  const irm = new ethers.Contract(marketParams.irm, irmAbi, provider) as any as Irm

  const price = await oracle.price()
  const rate = await irm.borrowRateView(marketParams, market)

  const collateralAmount = new BigNumber(positionParams.collateral.toString()).div(TEN.pow(collateralPrecision))
  const debtAmount = new BigNumber(positionParams.borrowShares.toString()).div(TEN.pow(quotePrecision))

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
      totalSupplyAssets: new BigNumber(market.totalSupplyAssets.toString()).div(TEN.pow(18)),
      totalSupplyShares: new BigNumber(market.totalSupplyShares.toString()).div(TEN.pow(24)),
      totalBorrowAssets: new BigNumber(market.totalBorrowAssets.toString()).div(TEN.pow(18)),
      totalBorrowShares: new BigNumber(market.totalBorrowShares.toString()).div(TEN.pow(24)),
      lastUpdate: new BigNumber(market.lastUpdate.toString()),
      fee: new BigNumber(market.fee.toString()),
    },
    new BigNumber(price.toString()).div(TEN.pow(36 + quotePrecision - collateralPrecision)),
    new BigNumber(rate.toString()).div(TEN.pow(36)),
    pnl,
  )
}
