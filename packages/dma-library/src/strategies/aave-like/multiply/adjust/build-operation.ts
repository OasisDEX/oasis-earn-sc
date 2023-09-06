import { getForkedNetwork } from '@deploy-configurations/utils/network'
import { ZERO } from '@dma-common/constants'
import { AdjustRiskDownArgs } from '@dma-library/operations/aave/multiply/v3/adjust-risk-down'
import { AdjustRiskUpArgs } from '@dma-library/operations/aave/multiply/v3/adjust-risk-up'
import { resolveAaveLikeMultiplyOperations } from '@dma-library/operations/aave-like/resolve-aavelike-operations'
import { getAaveTokenAddresses } from '@dma-library/strategies/aave/common'
import { resolveFlashloanTokenAddress } from '@dma-library/strategies/aave-like/multiply/common'
import { FlashloanProvider, IOperation, SwapData } from '@dma-library/types'
import { resolveFlashloanProvider } from '@dma-library/utils/flashloan/resolve-provider'
import { feeResolver } from '@dma-library/utils/swap'
import * as Domain from '@domain'
import { IBaseSimulatedTransition } from '@domain'

import { AaveLikeAdjustDependencies, BuildOperationArgs } from './types'

export async function buildOperation({
  adjustRiskUp,
  swapData,
  simulation,
  collectFeeFrom,
  args,
  dependencies,
}: BuildOperationArgs): Promise<IOperation | undefined> {
  const positionType = dependencies.positionType
  const aaveLikeMultiplyOperations = resolveAaveLikeMultiplyOperations(
    dependencies.protocolType,
    positionType,
  )

  const addresses = dependencies.addresses
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    addresses,
  )

  const depositCollateralAmountInWei = args.depositedByUser?.collateralInWei || ZERO
  const depositDebtAmountInWei = args.depositedByUser?.debtInWei || ZERO
  const swapAmountBeforeFees = simulation.swap.fromTokenAmount

  const hasCollateralDeposit = args.depositedByUser?.collateralInWei?.gt(ZERO)
  const depositAddress = hasCollateralDeposit ? collateralTokenAddress : debtTokenAddress
  const depositAmount = hasCollateralDeposit
    ? args.depositedByUser?.collateralInWei
    : args.depositedByUser?.debtInWei
  const adjustRiskDown = !adjustRiskUp
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: adjustRiskUp,
    isEarnPosition: dependencies.positionType === 'Earn',
  })

  const adjustRiskArgs = {
    collateral: {
      address: collateralTokenAddress,
      amount: depositCollateralAmountInWei,
      isEth: args.collateralToken.symbol === 'ETH',
    },
    debt: {
      address: debtTokenAddress,
      amount: depositDebtAmountInWei,
      isEth: args.debtToken.symbol === 'ETH',
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
    flashloan: await buildAdjustFlashloan(
      adjustRiskUp,
      simulation,
      swapData,
      {
        ...args,
        debtToken: {
          ...args.debtToken,
          address: debtTokenAddress,
        },
        collateralToken: {
          ...args.collateralToken,
          address: collateralTokenAddress,
        },
      },
      dependencies,
    ),
    proxy: {
      address: dependencies.proxy,
      isDPMProxy: dependencies.isDPMProxy,
      owner: dependencies.user,
    },
    addresses,
    network: dependencies.network,
  }
  if (adjustRiskUp) {
    const borrowAmount = simulation.delta.debt.minus(depositDebtAmountInWei)
    const adjustRiskUpArgs: AdjustRiskUpArgs = {
      ...adjustRiskArgs,
      debt: {
        ...adjustRiskArgs.debt,
        borrow: {
          amount: borrowAmount,
        },
      },
    }
    return await aaveLikeMultiplyOperations.adjustRiskUp(adjustRiskUpArgs)
  }

  if (adjustRiskDown) {
    const withdrawCollateralAmount = simulation.delta.collateral.abs()
    const adjustRiskDownArgs: AdjustRiskDownArgs = {
      ...adjustRiskArgs,
      collateral: {
        ...adjustRiskArgs.collateral,
        withdrawal: {
          amount: withdrawCollateralAmount,
        },
      },
    }
    return await aaveLikeMultiplyOperations.adjustRiskDown(adjustRiskDownArgs)
  }

  throw new Error('No operation could be built')
}

export async function buildAdjustFlashloan(
  riskIsIncreasing: boolean,
  simulation: IBaseSimulatedTransition,
  swap: SwapData,
  args: BuildOperationArgs['args'] & {
    debtToken: { address: string }
    collateralToken: { address: string }
  },
  dependencies: AaveLikeAdjustDependencies,
) {
  const lendingProtocol = dependencies.protocolType
  const flashloanProvider = resolveFlashloanProvider(
    await getForkedNetwork(dependencies.provider),
    lendingProtocol,
  )

  if (flashloanProvider === FlashloanProvider.Balancer) {
    const fromSwapAmountBeforeFees = swap.fromTokenAmount
    const receivedAmountAfterSwap = swap.minToTokenAmount

    if (riskIsIncreasing) {
      return {
        token: {
          amount: Domain.debtToCollateralSwapFlashloan(fromSwapAmountBeforeFees),
          address: args.debtToken.address,
        },
        amount: Domain.debtToCollateralSwapFlashloan(fromSwapAmountBeforeFees),
        provider: FlashloanProvider.Balancer,
      }
    } else {
      return {
        token: {
          amount: Domain.collateralToDebtSwapFlashloan(receivedAmountAfterSwap),
          address: args.debtToken.address,
        },
        amount: Domain.collateralToDebtSwapFlashloan(receivedAmountAfterSwap),
        provider: FlashloanProvider.Balancer,
      }
    }
  }

  /**
   * A small adjustment to amount was made here to allow for existing code
   * to work on L2 with USDC. But, the more complete implementation for Balancer is above.
   * */
  const flashloanTokenAddress = resolveFlashloanTokenAddress(args.debtToken.address, dependencies)

  return {
    token: {
      amount:
        flashloanTokenAddress === dependencies.addresses.tokens.DAI
          ? simulation.delta.flashloanAmount.abs()
          : simulation.delta.flashloanAmount.abs().div(10 ** 12),
      address: flashloanTokenAddress,
    },
    amount: simulation.delta.flashloanAmount.abs(),
    provider: flashloanProvider,
  }
}
