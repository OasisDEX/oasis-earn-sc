import { UNUSED_FLASHLOAN_AMOUNT, ZERO } from '@dma-common/constants'
import { operations } from '@dma-library/operations'
import { AdjustRiskDownArgs } from '@dma-library/operations/aave/v2/adjust-risk-down'
import { AdjustRiskUpArgs } from '@dma-library/operations/aave/v2/adjust-risk-up'
import { BuildOperationV2Args } from '@dma-library/strategies/aave/adjust/types'
import { getAaveTokenAddresses } from '@dma-library/strategies/aave/get-aave-token-addresses'
import { FlashloanProvider } from '@dma-library/types/common'
import { feeResolver } from '@dma-library/utils/swap'

export async function buildOperationV2({
  adjustRiskUp,
  swapData,
  simulatedPositionTransition,
  collectFeeFrom,
  args,
  dependencies,
  addresses,
  network,
}: BuildOperationV2Args) {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const depositCollateralAmountInWei = args.depositedByUser?.collateralInWei || ZERO
  const depositDebtAmountInWei = args.depositedByUser?.debtInWei || ZERO
  const swapAmountBeforeFees = simulatedPositionTransition.swap.fromTokenAmount

  const adjustRiskDown = !adjustRiskUp
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: adjustRiskUp,
    isEarnPosition: args.positionType === 'Earn',
  })

  const hasCollateralDeposit = args.depositedByUser?.collateralInWei?.gt(ZERO)
  const depositAddress = hasCollateralDeposit ? collateralTokenAddress : debtTokenAddress
  const depositAmount = hasCollateralDeposit
    ? args.depositedByUser?.collateralInWei
    : args.depositedByUser?.debtInWei
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
    proxy: {
      address: dependencies.proxy,
      isDPMProxy: dependencies.isDPMProxy,
      owner: dependencies.user,
    },
    addresses,
  }

  if (adjustRiskUp) {
    const borrowAmount = simulatedPositionTransition.delta.debt.minus(depositDebtAmountInWei)
    const flAmt = simulatedPositionTransition.delta.flashloanAmount
    const flashloanAmount = flAmt.eq(ZERO) ? UNUSED_FLASHLOAN_AMOUNT : flAmt

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
          amount: flashloanAmount,
          address: dependencies.addresses.DAI,
        },
        amount: flashloanAmount,
        // Aave V2 not on L2
        provider: FlashloanProvider.DssFlash,
      },
      network,
    }
    return await operations.aave.v2.adjustRiskUp(adjustRiskUpArgs)
  }

  if (adjustRiskDown) {
    /*
     * The Maths can produce negative amounts for flashloan on decrease
     * because it's calculated using Debt Delta which will be negative
     */
    const flAmtAbs = (simulatedPositionTransition.delta?.flashloanAmount || ZERO).abs()
    const flashloanAmount = flAmtAbs.eq(ZERO) ? UNUSED_FLASHLOAN_AMOUNT : flAmtAbs
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
          address: dependencies.addresses.DAI,
          amount: flashloanAmount,
        },
        amount: flashloanAmount,
        // Aave V2 not on L2
        provider: FlashloanProvider.DssFlash,
      },
      network,
    }
    return await operations.aave.v2.adjustRiskDown(adjustRiskDownArgs)
  }

  throw new Error('No operation could be built')
}
