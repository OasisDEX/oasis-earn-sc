import { getForkedNetwork } from '@deploy-configurations/utils/network/index'
import { ZERO } from '@dma-common/constants'
import { resolveAaveLikeMultiplyOperations } from '@dma-library/operations/aave-like/resolve-aavelike-operations'
import { getAaveTokenAddresses } from '@dma-library/strategies/aave/common'
import {
  AaveLikeOpenArgs,
  AaveLikeOpenDependencies,
} from '@dma-library/strategies/aave-like/multiply/open/types'
import { SwapData } from '@dma-library/types'
import { resolveFlashloanProvider } from '@dma-library/utils/flashloan/resolve-provider'
import * as SwapUtils from '@dma-library/utils/swap'
import { IBaseSimulatedTransition } from '@domain'

export async function buildOperation(
  swapData: SwapData,
  simulation: IBaseSimulatedTransition,
  collectFeeFrom: 'sourceToken' | 'targetToken',
  reserveEModeCategory: number | undefined,
  args: AaveLikeOpenArgs & { flashloanToken: string },
  dependencies: AaveLikeOpenDependencies,
) {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const depositDebtAmountInWei = args.depositedByUser?.debtInWei || ZERO
  const swapAmountBeforeFees = simulation.swap.fromTokenAmount

  const isIncreasingRisk = true
  const fee = SwapUtils.feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk,
    isEarnPosition: dependencies.positionType === 'Earn',
  })

  const positionType = dependencies.positionType
  const aaveLikeMultiplyOperations = resolveAaveLikeMultiplyOperations(
    dependencies.protocolType,
    positionType,
  )

  const flashloanProvider = resolveFlashloanProvider(await getForkedNetwork(dependencies.provider))
  const hasCollateralDeposit = args.depositedByUser?.collateralInWei?.gt(ZERO)
  const depositAddress = hasCollateralDeposit ? collateralTokenAddress : debtTokenAddress
  const depositAmount = hasCollateralDeposit
    ? args.depositedByUser?.collateralInWei
    : args.depositedByUser?.debtInWei
  const borrowAmount = simulation.delta.debt.minus(depositDebtAmountInWei)

  const openArgs = {
    collateral: {
      address: collateralTokenAddress,
      isEth: args.collateralToken.symbol === 'ETH',
    },
    debt: {
      address: debtTokenAddress,
      isEth: args.debtToken.symbol === 'ETH',
      borrow: {
        amount: borrowAmount,
      },
    },
    deposit: {
      address: depositAddress,
      amount: depositAmount || ZERO,
    },
    swap: {
      fee: fee.toNumber(),
      data: swapData.exchangeCalldata,
      amount: swapAmountBeforeFees,
      collectFeeFrom,
      receiveAtLeast: swapData.minToTokenAmount,
    },
    flashloan: {
      token: {
        amount:
          args.flashloanToken === dependencies.addresses.tokens.DAI
            ? simulation.delta.flashloanAmount.abs()
            : simulation.delta.flashloanAmount.abs().div(10 ** 12),
        address: args.flashloanToken,
      },
      amount: simulation.delta.flashloanAmount.abs(),
      provider: flashloanProvider,
    },
    position: {
      type: dependencies.positionType,
    },
    emode: {
      categoryId: reserveEModeCategory || 0,
    },
    proxy: {
      address: dependencies.proxy,
      isDPMProxy: dependencies.isDPMProxy,
      owner: dependencies.user,
    },
    addresses: dependencies.addresses,
    network: dependencies.network,
  }

  return aaveLikeMultiplyOperations.open(openArgs)
}
