import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { prepareAjnaPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import { AjnaPosition, Strategy } from '@dma-library/types'
import { isRiskIncreasing } from '@dma-library/utils/swap'
import { views } from '@dma-library/views'
import { GetPoolData } from '@dma-library/views/ajna'
import { IRiskRatio } from '@domain'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

interface AjnaAdjustRiskArgs {
  poolAddress: Address
  dpmProxyAddress: Address
  collateralPrice: BigNumber
  quotePrice: BigNumber
  quoteTokenPrecision: number
  collateralTokenPrecision: number
  riskRatio: IRiskRatio
  position: AjnaPosition
}

interface AjnaAdjustDependencies {
  poolInfoAddress: Address
  ajnaProxyActions: Address
  provider: ethers.providers.Provider
  WETH: Address
  getPoolData: GetPoolData
  getPosition?: typeof views.ajna.getPosition
}

export type AjnaAdjustRiskStrategy = (
  args: AjnaAdjustRiskArgs,
  dependencies: AjnaAdjustDependencies,
) => Promise<Strategy<AjnaPosition>>

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
    txValue: resolveAjnaEthAction(isWithdrawingEth, ZERO),
  })
}

export const adjustMultiply: AjnaAdjustRiskStrategy = (
  args: AjnaAdjustRiskArgs,
  dependencies: AjnaAdjustDependencies,
) => {
  if (isRiskIncreasing(args.position.riskRatio, args.riskRatio)) {
    return adjustRiskUp(args, dependencies)
  } else {
    return adjustRiskDown(args, dependencies)
  }
}
