import { getForkedNetwork } from '@deploy-configurations/utils/network'
import { FEE_BASE, ONE } from '@dma-common/constants'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { resolveAaveLikeMultiplyOperations } from '@dma-library/operations/aave-like/resolve-aavelike-operations'
import { FlashloanProvider, IOperation, SwapData } from '@dma-library/types'
import { resolveFlashloanProvider } from '@dma-library/utils/flashloan/resolve-provider'
import { feeResolver } from '@dma-library/utils/swap'
import * as Domain from '@domain'
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
  } = args

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
    flashloan: await buildCloseFlashloan(
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

export async function buildCloseFlashloan(
  args: AaveLikeExpandedCloseArgs & {
    debtToken: { address: string }
    collateralToken: { address: string }
  },
  dependencies: AaveLikeCloseDependencies,
) {
  const lendingProtocol = dependencies.protocolType
  const flashloanProvider = resolveFlashloanProvider(
    await getForkedNetwork(dependencies.provider),
    lendingProtocol,
  )

  if (flashloanProvider === FlashloanProvider.Balancer) {
    const amountToFlashloan = dependencies.currentPosition.debt.amount
    return {
      token: {
        amount: Domain.debtToCollateralSwapFlashloan(amountToFlashloan),
        address: args.debtToken.address,
      },
      // Always balancer on Ajna for now
      provider: FlashloanProvider.Balancer,
      amount: Domain.debtToCollateralSwapFlashloan(amountToFlashloan),
    }
  }

  /**
   * A small adjustment to amount was made here to allow for existing code
   * to work on L2 with USDC. But, the more complete implementation for Balancer is above.
   * */
  const maxLoanToValueForFL = new BigNumber(
    args.protocolData.reserveDataForFlashloan.ltv.toString(),
  ).div(FEE_BASE)
  const flashloanTokenPrice = args.protocolData.flashloanAssetPriceInEth
  const collateralTokenPrice = args.protocolData.collateralTokenPriceInEth
  if (!flashloanTokenPrice || !collateralTokenPrice) {
    throw new Error('Missing price data')
  }
  const baseCurrencyPerFlashLoan = new BigNumber(flashloanTokenPrice.toString())
  const baseCurrencyPerCollateralToken = new BigNumber(collateralTokenPrice.toString())
  // EG STETH/ETH divided by ETH/DAI = STETH/ETH times by DAI/ETH = STETH/DAI
  const oracleFLtoCollateralToken = baseCurrencyPerCollateralToken.div(baseCurrencyPerFlashLoan)
  const amountToFlashloanInWei = amountToWei(
    amountFromWei(
      dependencies.currentPosition.collateral.amount,
      dependencies.currentPosition.collateral.precision,
    ).times(oracleFLtoCollateralToken),
    args.flashloanToken.precision,
  )
    .div(maxLoanToValueForFL.times(ONE.minus(FLASHLOAN_SAFETY_MARGIN)))
    .integerValue(BigNumber.ROUND_DOWN)

  return {
    token: {
      amount: amountToFlashloanInWei,
      address: args.flashloanToken.address,
    },
    amount: amountToFlashloanInWei,
    provider: flashloanProvider,
  }
}
