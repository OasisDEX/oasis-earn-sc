import { getForkedNetwork } from '@deploy-configurations/utils/network'
import { FEE_BASE, ONE } from '@dma-common/constants'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { operations } from '@dma-library/operations'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import { CloseArgs } from '@dma-library/operations/aave/v3/close'
import { AaveVersion } from '@dma-library/strategies'
import {
  AaveCloseDependencies,
  ExpandedAaveCloseArgs,
} from '@dma-library/strategies/aave/close/types'
import { IOperation, SwapData } from '@dma-library/types'
import { resolveFlashloanProvider } from '@dma-library/utils/flashloan/resolve-provider'
import { feeResolver } from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'
import { FLASHLOAN_SAFETY_MARGIN } from "@domain/constants";

export async function buildOperation(
  swapData: SwapData & {
    collectFeeFrom: 'sourceToken' | 'targetToken'
    preSwapFee: BigNumber
  },
  args: ExpandedAaveCloseArgs,
  dependencies: AaveCloseDependencies,
): Promise<IOperation> {
  const {
    collateralTokenAddress,
    debtTokenAddress,
    protocolValues: { reserveDataForFlashloan, flashloanTokenPrice, collateralTokenPrice },
    flashloanToken,
  } = args

  /* Calculate Amount to flashloan */
  const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(FEE_BASE)
  const baseCurrencyPerFlashLoan = new BigNumber(flashloanTokenPrice.toString())
  const baseCurrencyPerCollateralToken = new BigNumber(collateralTokenPrice.toString())
  // EG STETH/ETH divided by ETH/DAI = STETH/ETH times by DAI/ETH = STETH/DAI
  const oracleFLtoCollateralToken = baseCurrencyPerCollateralToken.div(baseCurrencyPerFlashLoan)

  const amountToFlashloanInWei = amountToWei(
    amountFromWei(
      dependencies.currentPosition.collateral.amount,
      dependencies.currentPosition.collateral.precision,
    ).times(oracleFLtoCollateralToken),
    flashloanToken.precision,
  )
    .div(maxLoanToValueForFL.times(ONE.minus(FLASHLOAN_SAFETY_MARGIN)))
    .integerValue(BigNumber.ROUND_DOWN)

  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol)
  const collateralAmountToBeSwapped = args.shouldCloseToCollateral
    ? swapData.fromTokenAmount.plus(swapData.preSwapFee)
    : dependencies.currentPosition.collateral.amount
  const collectFeeFrom = swapData.collectFeeFrom
  if (args.protocolVersion === AaveVersion.v2) {
    const closeArgs = {
      // In the close to collateral scenario we need to add the preSwapFee amount to the fromTokenAmount
      // So, that when taking the fee from the source token we are sending the Swap contract
      // the sum of the fee and the ultimately fromAmount that will be swapped
      collateralAmountToBeSwapped,
      flashloanAmount: amountToFlashloanInWei,
      fee: fee.toNumber(),
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      proxy: dependencies.proxy,
      collectFeeFrom,
      collateralTokenAddress,
      collateralIsEth: args.collateralToken.symbol === 'ETH',
      debtTokenAddress,
      debtTokenIsEth: args.debtToken.symbol === 'ETH',
      isDPMProxy: dependencies.isDPMProxy,
      network: dependencies.network,
    }
    return await operations.aave.v2.close(
      closeArgs,
      dependencies.addresses as AAVEStrategyAddresses,
    )
  }
  if (args.protocolVersion === AaveVersion.v3) {
    const flashloanProvider = resolveFlashloanProvider(
      await getForkedNetwork(dependencies.provider),
    )

    const closeArgs: CloseArgs = {
      collateral: {
        address: collateralTokenAddress,
        isEth: args.collateralToken.symbol === 'ETH',
      },
      debt: {
        address: debtTokenAddress,
        isEth: args.debtToken.symbol === 'ETH',
      },
      swap: {
        fee: fee.toNumber(),
        data: swapData.exchangeCalldata,
        amount: collateralAmountToBeSwapped,
        collectFeeFrom,
        receiveAtLeast: swapData.minToTokenAmount,
      },
      flashloan: {
        token: {
          amount: amountToFlashloanInWei,
          address: flashloanToken.address,
        },
        amount: amountToFlashloanInWei,
        provider: flashloanProvider,
      },
      position: {
        type: args.positionType,
        collateral: { amount: collateralAmountToBeSwapped },
      },
      proxy: {
        address: dependencies.proxy,
        isDPMProxy: dependencies.isDPMProxy,
        owner: dependencies.user,
      },
      addresses: dependencies.addresses as AAVEV3StrategyAddresses,
      network: dependencies.network,
    }

    return await operations.aave.v3.close(closeArgs)
  }

  throw new Error('Unsupported AAVE version')
}
