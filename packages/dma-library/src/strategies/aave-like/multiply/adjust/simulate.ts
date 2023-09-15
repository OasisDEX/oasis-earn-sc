import { TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { getAaveTokenAddresses } from '@dma-library/strategies/aave/common'
import {
  assertPosition,
  assertProtocolData,
  assertTokenPrices,
  resolveCurrentPositionForProtocol,
  resolveProtocolData,
} from '@dma-library/strategies/aave-like/common'
import {
  applyEmodeCategory,
  buildFlashloanSimArgs,
} from '@dma-library/strategies/aave-like/multiply/common'
import { SwapData } from '@dma-library/types'
import { WithFee } from '@dma-library/types/aave/fee'
import * as SwapUtils from '@dma-library/utils/swap'

import { AaveLikeAdjustDependencies, ExtendedAaveLikeAdjustArgs } from './types'

export async function simulate(
  isRiskIncreasing: boolean,
  quoteSwapData: SwapData,
  args: ExtendedAaveLikeAdjustArgs & WithFee,
  dependencies: AaveLikeAdjustDependencies,
  fromTokenIsDebt: boolean,
  debug?: boolean,
) {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const currentPosition = await resolveCurrentPositionForProtocol(args, dependencies)
  const protocolData = await resolveProtocolData(
    {
      collateralTokenAddress,
      debtTokenAddress,
      flashloanTokenAddress: args.flashloanToken.address,
      addresses: dependencies.addresses,
      provider: dependencies.provider,
    },
    dependencies.protocolType,
  )

  assertPosition(currentPosition)
  assertProtocolData(protocolData)

  const {
    flashloanAssetPriceInEth,
    debtTokenPriceInEth,
    collateralTokenPriceInEth,
    reserveDataForFlashloan,
    eModeCategoryData,
  } = protocolData

  const multiple = args.multiple

  const depositDebtAmountInBaseUnits = args.depositedByUser?.debtInWei || ZERO
  const depositCollateralAmountInBaseUnits = args.depositedByUser?.collateralInWei || ZERO

  const fromToken = fromTokenIsDebt ? args.debtToken : args.collateralToken
  const toToken = fromTokenIsDebt ? args.collateralToken : args.debtToken
  // Needs to be correct precision. First convert to base 18. Then divide
  const fromTokenPrecision = fromToken.precision
  const toTokenPrecision = toToken.precision

  const normalisedFromTokenAmount = amountToWei(
    amountFromWei(quoteSwapData.fromTokenAmount, fromTokenPrecision),
    TYPICAL_PRECISION,
  )
  const normalisedToTokenAmount = amountToWei(
    amountFromWei(quoteSwapData.toTokenAmount, toTokenPrecision),
    TYPICAL_PRECISION,
  )

  const quoteMarketPriceWhenAdjustingUp = normalisedFromTokenAmount.div(normalisedToTokenAmount)
  const quoteMarketPriceWhenAdjustingDown = normalisedToTokenAmount.div(normalisedFromTokenAmount)
  const quoteMarketPrice = isRiskIncreasing
    ? quoteMarketPriceWhenAdjustingUp
    : quoteMarketPriceWhenAdjustingDown

  const flashloanFee = ZERO

  const [_debtTokenPriceInEth, _flashloanAssetPriceInEth, _collateralTokenPriceInEth] =
    assertTokenPrices(debtTokenPriceInEth, flashloanAssetPriceInEth, collateralTokenPriceInEth)

  const oracleFLtoDebtToken = _debtTokenPriceInEth.div(_flashloanAssetPriceInEth)
  const oracle = _collateralTokenPriceInEth.div(_debtTokenPriceInEth)

  const collectFeeFrom = SwapUtils.acceptedFeeTokenBySymbol({
    fromTokenSymbol: fromToken.symbol,
    toTokenSymbol: toToken.symbol,
  })

  return {
    simulatedPositionTransition: applyEmodeCategory(
      currentPosition,
      eModeCategoryData,
    ).adjustToTargetRiskRatio(multiple, {
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
      flashloan: await buildFlashloanSimArgs(
        args.flashloanToken.address,
        dependencies,
        reserveDataForFlashloan,
      ),
      depositedByUser: {
        debtInWei: depositDebtAmountInBaseUnits,
        collateralInWei: depositCollateralAmountInBaseUnits,
      },
      collectSwapFeeFrom: collectFeeFrom,
      debug,
    }),
  }
}
