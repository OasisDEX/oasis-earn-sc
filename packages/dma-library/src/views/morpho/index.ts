import { MorphoBluePosition } from '@dma-library/types'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

interface Args {
  proxyAddress: string
  collateralPrice: BigNumber
  quotePrice: BigNumber
}

interface Dependencies {
  provider: ethers.providers.Provider
  getCumulatives: () => {
    borrowCumulativeDepositUSD: BigNumber
    borrowCumulativeFeesUSD: BigNumber
    borrowCumulativeWithdrawUSD: BigNumber
  }
}

export async function getMorphoPosition(
  { proxyAddress, collateralPrice, quotePrice }: Args,
  { getCumulatives }: Dependencies,
): Promise<MorphoBluePosition> {
  const collateralAmount = new BigNumber(5)
  const debtAmount = new BigNumber(2000)

  const { borrowCumulativeWithdrawUSD, borrowCumulativeFeesUSD, borrowCumulativeDepositUSD } =
    getCumulatives()

  const netValue = collateralAmount.times(collateralPrice).minus(debtAmount.times(quotePrice))

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
    collateralPrice,
    quotePrice,
    pnl,
  )
}
