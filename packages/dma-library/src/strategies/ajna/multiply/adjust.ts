import { ZERO } from '@dma-common/constants'
import { prepareAjnaPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { AjnaCommonDependencies, AjnaPosition } from '@dma-library/types'
import { AjnaMultiplyPayload, AjnaStrategy } from '@dma-library/types/ajna'
import { isRiskIncreasing } from '@dma-library/utils/swap'

export type AjnaAdjustRiskStrategy = (
  args: AjnaMultiplyPayload,
  dependencies: AjnaCommonDependencies,
) => Promise<AjnaStrategy<AjnaPosition>>

const adjustRiskUp: AjnaAdjustRiskStrategy = async (args, dependencies) => {
  const isDepositingEth =
    args.position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  // TODO get collateral change from swap
  const positionAfterDeposit = args.position.deposit(ZERO)

  const quoteAmount = args.riskRatio.loanToValue.times(
    positionAfterDeposit.collateralAmount.times(args.collateralPrice),
  )

  const targetPosition = positionAfterDeposit.borrow(quoteAmount.minus(args.position.debtAmount))

  return prepareAjnaPayload({
    dependencies,
    targetPosition,
    data: '',
    errors: [],
    warnings: [],
    notices: [],
    successes: [],
    // TODO instead of zero we will need data from swap
    txValue: resolveAjnaEthAction(isDepositingEth, ZERO),
  })
}

const adjustRiskDown: AjnaAdjustRiskStrategy = async (args, dependencies) => {
  const isWithdrawingEth =
    args.position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  // TODO get collateral change from swap
  const positionAfterWithdraw = args.position.withdraw(ZERO)

  const quoteAmount = args.riskRatio.loanToValue.times(
    positionAfterWithdraw.collateralAmount.times(args.collateralPrice),
  )

  const targetPosition = positionAfterWithdraw.payback(args.position.debtAmount.minus(quoteAmount))

  return prepareAjnaPayload({
    dependencies,
    targetPosition,
    data: '',
    errors: [],
    warnings: [],
    notices: [],
    successes: [],
    // TODO instead of zero we will need data from swap
    txValue: resolveAjnaEthAction(isWithdrawingEth, ZERO),
  })
}

export const adjustMultiply: AjnaAdjustRisk






= (
  args: AjnaMultiplyPayload,
  dependencies: AjnaCommonDependencies,
) => {
  if (isRiskIncreasing(args.position.riskRatio.loanToValue, args.riskRatio.loanToValue)) {
    return adjustRiskUp(args, dependencies)
  } else {
    return adjustRiskDown(args, dependencies)
  }
}
