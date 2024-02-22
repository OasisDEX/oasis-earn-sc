import { ZERO } from '@dma-common/constants'
import { LendingCumulativesData } from '@dma-library/types'
import { AaveLikeCumulativeData } from '@dma-library/views/aave/types'
import { BigNumber } from 'bignumber.js'

const defaultLendingCumulatives = {
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
  withFees: ZERO,
  withoutFees: ZERO,
}

export const mapAaveLikeCumulatives = (
  cumulatives?: AaveLikeCumulativeData,
): { withFees: BigNumber; withoutFees: BigNumber; cumulatives: LendingCumulativesData } =>
  cumulatives
    ? {
        cumulatives: {
          ...defaultLendingCumulatives.cumulatives,
          borrowCumulativeDepositInCollateralToken: cumulatives.cumulativeDepositInCollateralToken,
          borrowCumulativeWithdrawInCollateralToken:
            cumulatives.cumulativeWithdrawInCollateralToken,
          borrowCumulativeDepositInQuoteToken: cumulatives.cumulativeDepositInQuoteToken,
          borrowCumulativeWithdrawInQuoteToken: cumulatives.cumulativeWithdrawInQuoteToken,
          borrowCumulativeFeesInCollateralToken: cumulatives.cumulativeFeesInCollateralToken,
          borrowCumulativeFeesInQuoteToken: cumulatives.cumulativeFeesInQuoteToken,
          borrowCumulativeFeesUSD: cumulatives.cumulativeFeesUSD,
          borrowCumulativeDepositUSD: cumulatives.cumulativeDepositUSD,
          borrowCumulativeWithdrawUSD: cumulatives.cumulativeWithdrawUSD,
        },
        withFees: ZERO,
        withoutFees: ZERO,
      }
    : defaultLendingCumulatives
