import { TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { getAaveTokenAddresses } from '@dma-library/strategies/aave/common'
import { SwapData } from '@dma-library/types'
import { WithFee } from '@dma-library/types/aave/fee'
import { acceptedFeeToken } from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

import { getCurrentPosition } from './get-current-position'
import { getProtocolData } from './get-protocol-data'
import { AaveAdjustDependencies, ExtendedAaveAdjustArgs } from './types'

export async function simulatePositionTransition(
  isRiskIncreasing: boolean,
  quoteSwapData: SwapData,
  args: ExtendedAaveAdjustArgs & WithFee,
  dependencies: AaveAdjustDependencies,
  fromTokenIsDebt: boolean,
  debug?: boolean,
) {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const currentPosition = await getCurrentPosition(args, dependencies)
  const protocolData = await getProtocolData(
    collateralTokenAddress,
    debtTokenAddress,
    args,
    args.flashloanToken.address,
    dependencies,
  )

  if (!currentPosition || !protocolData) {
    throw new Error('Could not get current position or protocol data')
  }

  const {
    aaveFlashloanAssetPriceInEth,
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    reserveDataForFlashloan,
  } = protocolData

  const BASE = new BigNumber(10000)
  const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(BASE)

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

  const flashloanFee = new BigNumber(0)

  const ethPerFlashloanToken = aaveFlashloanAssetPriceInEth
  const ethPerDebtToken = aaveDebtTokenPriceInEth
  const oracleFLtoDebtToken = ethPerDebtToken.div(ethPerFlashloanToken)
  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

  const collectFeeFrom = acceptedFeeToken({
    fromToken: fromToken.symbol,
    toToken: toToken.symbol,
  })

  return {
    simulatedPositionTransition: currentPosition.adjustToTargetRiskRatio(multiple, {
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
      flashloan: {
        maxLoanToValueFL: maxLoanToValueForFL,
        tokenSymbol: args.flashloanToken.symbol,
      },
      depositedByUser: {
        debtInWei: depositDebtAmountInBaseUnits,
        collateralInWei: depositCollateralAmountInBaseUnits,
      },
      collectSwapFeeFrom: collectFeeFrom,
      debug,
    }),
  }
}
