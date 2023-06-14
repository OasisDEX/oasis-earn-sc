import { ZERO } from '@dma-common/constants'
import { prepareAjnaDMAPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { AjnaPosition, Strategy } from '@dma-library/types'
import { AjnaAdjustMultiplyPayload, AjnaCommonDMADependencies } from '@dma-library/types/ajna'
import { isRiskIncreasing } from '@dma-library/utils/swap'

export type AjnaAdjustRiskStrategy = (
  args: AjnaAdjustMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
) => Promise<Strategy<AjnaPosition>>

export const adjustMultiply: AjnaAdjustRiskStrategy = (
  args: AjnaAdjustMultiplyPayload,
  dependencies: AjnaCommonDMADependencies,
) => {
  if (isRiskIncreasing(args.position.riskRatio, args.riskRatio)) {
    return adjustRiskUp(args, dependencies)
  } else {
    return adjustRiskDown(args, dependencies)
  }
}

const adjustRiskUp: AjnaAdjustRiskStrategy = async (args, dependencies) => {
  // Get position (see Close)
  // Simulate adjust
  // Get swap data
  // Build operation
  // prepare payload
  const isDepositingEth =
    args.position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  // TODO get collateral change from swap
  const positionAfterDeposit = args.position.deposit(ZERO)

  const quoteAmount = args.riskRatio.loanToValue.times(
    positionAfterDeposit.collateralAmount.times(args.collateralPrice),
  )

  const targetPosition = positionAfterDeposit.borrow(quoteAmount.minus(args.position.debtAmount))

  return prepareAjnaDMAPayload({
    dependencies,
    targetPosition,
    data: '',
    swaps: [],
    errors: [],
    warnings: [],
    notices: [],
    success: [],
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

  return prepareAjnaDMAPayload({
    dependencies,
    targetPosition,
    data: '',
    swaps: [],
    errors: [],
    warnings: [],
    notices: [],
    success: [],
    // TODO instead of zero we will need data from swap
    txValue: resolveAjnaEthAction(isWithdrawingEth, ZERO),
  })
}
