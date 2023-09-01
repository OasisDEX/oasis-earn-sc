import { getForkedNetwork } from '@deploy-configurations/utils/network'
import { FEE_BASE, ONE } from '@dma-common/constants'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { resolveAaveLikeMultiplyOperations } from '@dma-library/operations/aave-like/resolve-aavelike-operations'
import { IOperation, SwapData } from '@dma-library/types'
import { resolveFlashloanProvider } from '@dma-library/utils/flashloan/resolve-provider'
import { feeResolver } from '@dma-library/utils/swap'
import { FLASHLOAN_SAFETY_MARGIN } from '@domain/constants'
import BigNumber from 'bignumber.js'

import { AaveLikeCloseDependencies, AaveLikeExpandedCloseArgs } from './types'

export async function buildOperation(
  swapData: SwapData & {
    collectFeeFrom: 'sourceToken' | 'targetToken'
    preSwapFee: BigNumber
  },
  args: AaveLikeExpandedCloseArgs,
  dependencies: AaveLikeCloseDependencies,
): Promise<IOperation> {
  const {
    collateralToken: { address: collateralTokenAddress },
    debtToken: { address: debtTokenAddress },
    protocolData: {
      reserveDataForFlashloan,
      flashloanAssetPriceInEth: flashloanTokenPrice,
      collateralTokenPriceInEth: collateralTokenPrice,
    },
    flashloanToken,
  } = args

  if (!flashloanTokenPrice || !collateralTokenPrice) {
    throw new Error('Missing price data')
  }

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

  const positionType = dependencies.positionType
  const aaveLikeMultiplyOperations = resolveAaveLikeMultiplyOperations(
    dependencies.protocolType,
    positionType,
  )

  const flashloanProvider = resolveFlashloanProvider(await getForkedNetwork(dependencies.provider))
  const closeArgs = {
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
      type: dependencies.positionType,
      collateral: { amount: collateralAmountToBeSwapped },
    },
    proxy: {
      address: dependencies.proxy,
      isDPMProxy: dependencies.isDPMProxy,
      owner: dependencies.user,
    },
    addresses: dependencies.addresses,
    network: dependencies.network,
  }

  return aaveLikeMultiplyOperations.close(closeArgs)
}
