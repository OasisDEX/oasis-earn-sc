import { ZERO } from '@dma-common/constants'
import { normalizeValue } from '@dma-common/utils/common'
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

export const mapAaveLikeCumulatives = ({
  cumulatives,
  netValue,
  collateralPrice,
  debtPrice,
  isCorrelated,
}: {
  cumulatives?: AaveLikeCumulativeData
  netValue: BigNumber
  collateralPrice: BigNumber
  debtPrice: BigNumber
  isCorrelated: boolean
}): { withFees: BigNumber; withoutFees: BigNumber; cumulatives: LendingCumulativesData } => {
  if (!cumulatives) {
    return defaultLendingCumulatives
  }

  const mappedCumulatives = {
    ...defaultLendingCumulatives.cumulatives,
    borrowCumulativeDepositInCollateralToken: cumulatives.cumulativeDepositInCollateralToken,
    borrowCumulativeWithdrawInCollateralToken: cumulatives.cumulativeWithdrawInCollateralToken,
    borrowCumulativeDepositInQuoteToken: cumulatives.cumulativeDepositInQuoteToken,
    borrowCumulativeWithdrawInQuoteToken: cumulatives.cumulativeWithdrawInQuoteToken,
    borrowCumulativeFeesInCollateralToken: cumulatives.cumulativeFeesInCollateralToken,
    borrowCumulativeFeesInQuoteToken: cumulatives.cumulativeFeesInQuoteToken,
    borrowCumulativeFeesUSD: cumulatives.cumulativeFeesUSD,
    borrowCumulativeDepositUSD: cumulatives.cumulativeDepositUSD,
    borrowCumulativeWithdrawUSD: cumulatives.cumulativeWithdrawUSD,
  }

  if (isCorrelated) {
    return {
      cumulatives: mappedCumulatives,
      withFees: normalizeValue(
        mappedCumulatives.borrowCumulativeWithdrawInQuoteToken
          .plus(netValue.div(debtPrice))
          .minus(mappedCumulatives.borrowCumulativeDepositInQuoteToken)
          .minus(mappedCumulatives.borrowCumulativeFeesInQuoteToken)
          .div(mappedCumulatives.borrowCumulativeDepositInQuoteToken),
      ),
      withoutFees: normalizeValue(
        mappedCumulatives.borrowCumulativeWithdrawInQuoteToken
          .plus(netValue.div(debtPrice))
          .minus(mappedCumulatives.borrowCumulativeDepositInQuoteToken)
          .div(mappedCumulatives.borrowCumulativeDepositInQuoteToken),
      ),
    }
  }

  return {
    cumulatives: mappedCumulatives,
    withFees: normalizeValue(
      mappedCumulatives.borrowCumulativeWithdrawInCollateralToken
        .plus(netValue.div(collateralPrice))
        .minus(mappedCumulatives.borrowCumulativeDepositInCollateralToken)
        .minus(mappedCumulatives.borrowCumulativeFeesInCollateralToken)
        .div(mappedCumulatives.borrowCumulativeDepositInCollateralToken),
    ),
    withoutFees: normalizeValue(
      mappedCumulatives.borrowCumulativeWithdrawInCollateralToken
        .plus(netValue.div(collateralPrice))
        .minus(mappedCumulatives.borrowCumulativeDepositInCollateralToken)
        .div(mappedCumulatives.borrowCumulativeDepositInCollateralToken),
    ),
  }
}
