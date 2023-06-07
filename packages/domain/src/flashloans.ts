import { ONE } from '@dma-common/constants'
import { revertToTokenSpecificPrecision, standardiseAmountTo18Decimals } from '@domain/utils'
import BigNumber from 'bignumber.js'

import { FLASHLOAN_SAFETY_MARGIN } from './constants'

interface TransientCollateralFlashloan {
  (
    fee: BigNumber,
    /** The price of 1 unit of debt with respect to the flashloan token */
    oraclePrice: BigNumber,
    /** The amount that needs to be borrowed and needs to be transiently collateralised by the flashloan  */
    debtAmountToCover: BigNumber,
    /** The precision of the flashloan token */
    flashloanTokenPrecision?: number,
    /** The precision of the flashloan token */
    debtTokenPrecision?: number,
    /** The maximum loan to value ratio that the flashloan can be used to collateralise when borrowing against it */
    maxLoanToValueWhenCollateralising?: BigNumber,
  ): BigNumber
}

/** For example, flashloaning DAI to open an ETH/USDC position on AAVE */
export const transientCollateralFlashloan: TransientCollateralFlashloan = (
  fee,
  oraclePrice,
  debtAmountToCover,
  flashloanTokenPrecision = 18,
  debtTokenPrecision = 18,
  maxLoanToValueWhenCollateralising = ONE,
) => {
  /**
   * We normalise debtAmountToCover to 18 decimals and denormalise back to the precision of the FL
   * See packages/domain/src/utils/precision.ts
   * */
  const flashloan = revertToTokenSpecificPrecision(
    standardiseAmountTo18Decimals(debtAmountToCover, debtTokenPrecision),
    flashloanTokenPrecision,
  )
    .times(oraclePrice)
    .div(maxLoanToValueWhenCollateralising.times(ONE.minus(FLASHLOAN_SAFETY_MARGIN)))
    .integerValue(BigNumber.ROUND_DOWN)

  return flashloan
}

/** For example, flashloaning USDC to open an ETH/USDC position on Ajna */
export const debtToCollateralSwapFlashloan = (swapAmountBeforeSwapFeeIsApplied: BigNumber) => {
  // We do not need to inflate this value to account for the flashloan fee because
  // This is already factored into the debt (or quote token) deltas produced
  // by the adjustPosition domain logic
  return swapAmountBeforeSwapFeeIsApplied
}
