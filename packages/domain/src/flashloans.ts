import { ONE } from '@dma-common/constants'
import BigNumber from 'bignumber.js'

import { FLASHLOAN_SAFETY_MARGIN } from './constants'

interface TransientCollateralFlashloan {
  (
    fee: BigNumber,
    /** The price of 1 unit of debt with respect to the flashloan token */
    oraclePrice: BigNumber,
    /** The amount that needs to be borrowed and needs to be transiently collateralised by the flashloan  */
    debtAmountToCover: BigNumber,
    /** The maximum loan to value ratio that the flashloan can be used to collateralise when borrowing against it */
    maxLoanToValueWhenCollateralising?: BigNumber,
    options?: {
      /** Whether to use the flashloan safety margin */
      useFlashloanSafetyMargin?: boolean
    },
  ): BigNumber
}

/** For example, flashloaning DAI to open an ETH/USDC position on AAVE */
export const transientCollateralFlashloan: TransientCollateralFlashloan = (
  fee,
  oraclePrice,
  debtAmountToCover,
  maxLoanToValueWhenCollateralising = ONE,
  options,
) => {
  const { useFlashloanSafetyMargin = false } = options || {}
  return debtAmountToCover
    .times(oraclePrice)
    .div(
      maxLoanToValueWhenCollateralising.times(
        useFlashloanSafetyMargin ? ONE.minus(FLASHLOAN_SAFETY_MARGIN) : ONE,
      ),
    )
    .integerValue(BigNumber.ROUND_DOWN)
}

/** For example, flashloaning USDC to open an ETH/USDC position on Ajna */
export const debtToCollateralSwapFlashloan = () => {}
