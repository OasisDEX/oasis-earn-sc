import { prepareAjnaPayload, resolveAjnaEthAction } from '@dma-library/protocols/ajna'
import {
  AjnaCommonDependencies,
  AjnaOpenMultiplyPayload,
  AjnaPosition,
  Strategy,
} from '@dma-library/types/ajna'
import { views } from '@dma-library/views'
import BigNumber from 'bignumber.js'

export type AjnaOpenMultiplyStrategy = (
  args: AjnaOpenMultiplyPayload,
  dependencies: AjnaCommonDependencies,
) => Promise<Strategy<AjnaPosition>>

export const openMultiply: AjnaOpenMultiplyStrategy = async (args, dependencies) => {
  const getPosition = views.ajna.getPosition
  const position = await getPosition(
    {
      collateralPrice: args.collateralPrice,
      quotePrice: args.quotePrice,
      proxyAddress: args.dpmProxyAddress,
      poolAddress: args.poolAddress,
    },
    {
      poolInfoAddress: dependencies.poolInfoAddress,
      provider: dependencies.provider,
      getPoolData: dependencies.getPoolData,
    },
  )

  if (position.collateralAmount.gt(0)) {
    throw new Error('Position already exists')
  }

  const isDepositingEth =
    position.pool.collateralToken.toLowerCase() === dependencies.WETH.toLowerCase()

  const positionAfterDeposit = position.deposit(args.collateralAmount)

  const quoteAmount = (
    args.riskRatio.loanToValue.isZero()
      ? positionAfterDeposit.minRiskRatio.loanToValue.decimalPlaces(2, BigNumber.ROUND_UP)
      : args.riskRatio.loanToValue
  ).times(args.collateralAmount.times(args.collateralPrice))

  const targetPosition = positionAfterDeposit.borrow(quoteAmount)

  return prepareAjnaPayload({
    dependencies,
    targetPosition,
    data: '',
    errors: [],
    warnings: [],
    notices: [],
    successes: [],
    txValue: resolveAjnaEthAction(isDepositingEth, args.collateralAmount),
  })
}
