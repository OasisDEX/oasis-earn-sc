import { ONE } from '@dma-common/constants'
import { negativeToZero } from '@dma-common/utils/common'
import { RiskRatio } from '@domain'
import BigNumber from 'bignumber.js'

// buying power in $
export const getBuyingPower = ({
  netValue,
  collateralPrice,
  marketPrice,
  debtAmount,
  maxRiskRatio,
}: {
  netValue: BigNumber
  collateralPrice: BigNumber
  marketPrice: BigNumber
  debtAmount: BigNumber
  maxRiskRatio: RiskRatio
}) => {
  const netValueInCollateral = netValue.div(collateralPrice)

  return negativeToZero(
    netValueInCollateral
      .div(ONE.minus(maxRiskRatio.loanToValue))
      .minus(netValueInCollateral)
      .minus(debtAmount.div(marketPrice))
      .times(collateralPrice),
  )
}
