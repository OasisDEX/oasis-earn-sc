import { Network } from '@deploy-configurations/types/network'
import { getForkedNetwork } from '@deploy-configurations/utils/network'
import { ZERO } from '@dma-common/constants'
import { operations } from '@dma-library/operations'
import { AdjustRiskDownArgs } from '@dma-library/operations/aave/v3/adjust-risk-down'
import { AdjustRiskUpArgs } from '@dma-library/operations/aave/v3/adjust-risk-up'
import { BuildOperationV3Args } from '@dma-library/strategies/aave/adjust/types'
import { getAaveTokenAddresses } from '@dma-library/strategies/aave/get-aave-token-addresses'
import { resolveFlashloanProvider } from '@dma-library/utils/flashloan/resolve-provider'
import { feeResolver } from '@dma-library/utils/swap'

export async function buildOperationV3({
  adjustRiskUp,
  swapData,
  simulatedPositionTransition,
  collectFeeFrom,
  args,
  dependencies,
  addresses,
  network,
}: BuildOperationV3Args) {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    addresses,
  )

  const flashloanToken =
    dependencies.network === Network.MAINNET
      ? dependencies.addresses.DAI
      : dependencies.addresses.USDC

  const depositCollateralAmountInWei = args.depositedByUser?.collateralInWei || ZERO
  const depositDebtAmountInWei = args.depositedByUser?.debtInWei || ZERO
  const swapAmountBeforeFees = simulatedPositionTransition.swap.fromTokenAmount

  const hasCollateralDeposit = args.depositedByUser?.collateralInWei?.gt(ZERO)
  const depositAddress = hasCollateralDeposit ? collateralTokenAddress : debtTokenAddress
  const depositAmount = hasCollateralDeposit
    ? args.depositedByUser?.collateralInWei
    : args.depositedByUser?.debtInWei
  const adjustRiskDown = !adjustRiskUp
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: adjustRiskUp,
    isEarnPosition: args.positionType === 'Earn',
  })
  const flashloanProvider = resolveFlashloanProvider(await getForkedNetwork(dependencies.provider))

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
    flashloan: {
      token: {
        amount: flashloanToken === dependencies.addresses.DAI
          ? simulatedPositionTransition.delta.flashloanAmount.abs()
          : simulatedPositionTransition.delta.flashloanAmount.abs().div(10 ** 12),
        address: flashloanToken,
      },
      provider: flashloanProvider,
    },
    proxy: {
      address: dependencies.proxy,
      isDPMProxy: dependencies.isDPMProxy,
      owner: dependencies.user,
    },
    addresses,
  }
  if (adjustRiskUp) {
    const borrowAmount = simulatedPositionTransition.delta.debt.minus(depositDebtAmountInWei)
    const adjustRiskUpArgs: AdjustRiskUpArgs = {
      ...adjustRiskArgs,
      debt: {
        ...adjustRiskArgs.debt,
        borrow: {
          amount: borrowAmount,
        },
      },
      flashloan: {
        token: {
          amount: flashloanToken === dependencies.addresses.DAI
            ? simulatedPositionTransition.delta.flashloanAmount.abs()
            : simulatedPositionTransition.delta.flashloanAmount.abs().div(10 ** 12),
          address: flashloanToken,
        },
        amount: simulatedPositionTransition.delta.flashloanAmount.abs(),
        provider: flashloanProvider,
      },
      network,
    }
    return await operations.aave.v3.adjustRiskUp(adjustRiskUpArgs)
  }

  if (adjustRiskDown) {
    const withdrawCollateralAmount = simulatedPositionTransition.delta.collateral.abs()
    const adjustRiskDownArgs: AdjustRiskDownArgs = {
      ...adjustRiskArgs,
      collateral: {
        ...adjustRiskArgs.collateral,
        withdrawal: {
          amount: withdrawCollateralAmount,
        },
      },
      flashloan: {
        token: {
          amount: flashloanToken === dependencies.addresses.DAI
            ? simulatedPositionTransition.delta.flashloanAmount.abs()
            : simulatedPositionTransition.delta.flashloanAmount.abs().div(10 ** 12),
          address: flashloanToken,
        },
        amount: simulatedPositionTransition.delta.flashloanAmount.abs(),
        provider: flashloanProvider,
      },
      network,
    }
    return await operations.aave.v3.adjustRiskDown(adjustRiskDownArgs)
  }

  throw new Error('No operation could be built')
}
