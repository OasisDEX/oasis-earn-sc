import { getForkedNetwork } from '@deploy-configurations/utils/network'
import { ZERO } from '@dma-common/constants'
import { AdjustRiskDownArgs } from '@dma-library/operations/aave/multiply/v3/adjust-risk-down'
import { AdjustRiskUpArgs } from '@dma-library/operations/aave/multiply/v3/adjust-risk-up'
import { resolveAaveLikeMultiplyOperations } from '@dma-library/operations/aave-like/resolve-aavelike-operations'
import { getAaveTokenAddresses } from '@dma-library/strategies/aave/common'
import { IOperation, SwapData } from '@dma-library/types'
import { resolveFlashloanProvider } from '@dma-library/utils/flashloan/resolve-provider'
import { feeResolver } from '@dma-library/utils/swap'
import * as Domain from '@domain'
import { IBaseSimulatedTransition } from '@domain'
import BigNumber from 'bignumber.js'

import { AaveLikeAdjustDependencies, BuildOperationArgs } from './types'

export async function buildOperation({
  adjustRiskUp,
  swapData,
  preSwapFee,
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
  const swapAmountBeforeFees = swapData.fromTokenAmount.plus(preSwapFee)

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
      preSwapFee,
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
  preSwapFee: BigNumber,
  swap: SwapData,
  args: BuildOperationArgs['args'] & {
    debtToken: { address: string }
    collateralToken: { address: string }
  },
  dependencies: AaveLikeAdjustDependencies,
) {
  const lendingProtocol = dependencies.protocolType
  const flashloanProvider = resolveFlashloanProvider({
    network: await getForkedNetwork(dependencies.provider),
    lendingProtocol,
    debtToken: args.debtToken.symbol,
    collateralToken: args.collateralToken.symbol,
  })

  if (dependencies.protocolType === 'Spark') {
    // Need to add fees to the swap amount
    const fromSwapAmountBeforeFees = swap.fromTokenAmount.plus(preSwapFee)
    const receivedAmountAfterSwap = swap.minToTokenAmount

    if (riskIsIncreasing) {
      return {
        token: {
          symbol: args.debtToken.symbol,
          amount: Domain.debtToCollateralSwapFlashloan(fromSwapAmountBeforeFees),
          address: args.debtToken.address,
        },
        amount: Domain.debtToCollateralSwapFlashloan(fromSwapAmountBeforeFees),
        provider: flashloanProvider,
      }
    } else {
      return {
        token: {
          symbol: args.debtToken.symbol,
          amount: Domain.collateralToDebtSwapFlashloan(receivedAmountAfterSwap),
          address: args.debtToken.address,
        },
        amount: Domain.collateralToDebtSwapFlashloan(receivedAmountAfterSwap),
        provider: flashloanProvider,
      }
    }
  }

  return {
    token: {
      amount: simulation.flashloan.amount,
      symbol: simulation.flashloan.token.symbol,
      address: dependencies.addresses.tokens[simulation.flashloan.token.symbol],
    },
    amount: simulation.flashloan.amount,
    provider: flashloanProvider,
  }
}
