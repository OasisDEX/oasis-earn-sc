import { TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { amountFromWei } from '@dma-common/utils/common'
import { getAaveTokenAddresses, getFlashloanToken } from '@dma-library/strategies/aave/common'
import {
  assertTokenPrices,
  resolveCurrentPositionForProtocol,
  resolveProtocolData,
} from '@dma-library/strategies/aave-like/common'
import {
  applyEmodeCategory,
  buildFlashloanSimArgs,
  resolveFlashloanTokenAddress,
} from '@dma-library/strategies/aave-like/multiply/common'
import {
  AaveLikeOpenArgs,
  AaveLikeOpenDependencies,
} from '@dma-library/strategies/aave-like/multiply/open/types'
import { SwapData } from '@dma-library/types'
import { WithFee } from '@dma-library/types/aave/fee'
import * as SwapUtils from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

export async function simulate(
  quoteSwapData: SwapData,
  args: AaveLikeOpenArgs & WithFee,
  dependencies: AaveLikeOpenDependencies,
  debug?: boolean,
) {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const flashloan =
    args.flashloan ??
    getFlashloanToken({
      addresses: dependencies.addresses,
      network: dependencies.network,
      protocol: dependencies.protocolType,
      debt: {
        symbol: args.debtToken.symbol,
        address: debtTokenAddress,
        precision: args.debtToken.precision ?? TYPICAL_PRECISION,
      },
    }).flashloan

  /**
   * We've add current Position into all strategy dependencies
   * It turned out that after opening and then closing a position there might be artifacts
   * Left in a position that make it difficult to re-open it
   */
  const currentPosition = await resolveCurrentPositionForProtocol(args, dependencies)
  const protocolData = await resolveProtocolData(
    {
      collateralTokenAddress,
      debtTokenAddress,
      flashloanTokenAddress: flashloan.token.address,
      addresses: dependencies.addresses,
      provider: dependencies.provider,
    },
    dependencies.protocolType,
  )

  const {
    flashloanAssetPriceInEth,
    debtTokenPriceInEth,
    collateralTokenPriceInEth,
    reserveDataForFlashloan,
    reserveEModeCategory,
    eModeCategoryData,
  } = protocolData

  const multiple = args.multiple

  const depositDebtAmountInWei = args.depositedByUser?.debtInWei || ZERO
  const depositCollateralAmountInWei = args.depositedByUser?.collateralInWei || ZERO

  // Needs to be correct precision.
  const fromTokenAmountNormalised = amountFromWei(
    quoteSwapData.fromTokenAmount,
    args.debtToken.precision,
  )
  const toTokenAmountNormalised = amountFromWei(
    quoteSwapData.toTokenAmount,
    args.collateralToken.precision,
  )
  const quoteMarketPrice = fromTokenAmountNormalised.div(toTokenAmountNormalised)
  const flashloanFee = new BigNumber(0)

  const [_debtTokenPriceInEth, _flashloanAssetPriceInEth, _collateralTokenPriceInEth] =
    assertTokenPrices(debtTokenPriceInEth, flashloanAssetPriceInEth, collateralTokenPriceInEth)

  // EG USDC/ETH divided by ETH/DAI = USDC/ETH times by DAI/ETH = USDC/DAI
  const oracleFLtoDebtToken = _debtTokenPriceInEth.div(_flashloanAssetPriceInEth)

  // EG STETH/ETH divided by USDC/ETH = STETH/USDC
  const oracle = _collateralTokenPriceInEth.div(_debtTokenPriceInEth)

  const collectFeeFrom = SwapUtils.acceptedFeeToken({
    fromToken: args.debtToken.symbol,
    toToken: args.collateralToken.symbol,
  })

  /**
   * If using FMM then we send maxLoanToValueForFL as part of args to simulate
   * If using Balancer this fields is undefined
   *
   * Adjust logic does not need any info about flashloan so Domain should be refactored
   */
  const simulation = applyEmodeCategory(currentPosition, eModeCategoryData).adjustToTargetRiskRatio(
    multiple,
    {
      fees: {
        flashLoan: flashloanFee,
        oazo: args.fee,
      },
      prices: {
        market: quoteMarketPrice,
        oracle: oracle,
        oracleFLtoDebtToken: oracleFLtoDebtToken,
      },
      slippage: args.slippage,
      flashloan: await buildFlashloanSimArgs(flashloan, dependencies, reserveDataForFlashloan),
      depositedByUser: {
        debtInWei: depositDebtAmountInWei,
        collateralInWei: depositCollateralAmountInWei,
      },
      collectSwapFeeFrom: collectFeeFrom,
      debug,
    },
  )

  return {
    simulatedPositionTransition: simulation,
    reserveEModeCategory,
    flashloanTokenAddress: flashloan.token.address,
  }
}
