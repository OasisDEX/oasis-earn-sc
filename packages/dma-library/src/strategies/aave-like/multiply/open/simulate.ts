import { Network } from '@deploy-configurations/types/network'
import { FEE_BASE, ZERO } from '@dma-common/constants'
import { amountFromWei } from '@dma-common/utils/common'
import { getAaveTokenAddresses } from '@dma-library/strategies/aave/common'
import {
  resolveCurrentPositionForProtocol,
  resolveProtocolData,
} from '@dma-library/strategies/aave-like/common'
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

  const flashloanTokenAddress =
    dependencies.network === Network.MAINNET
      ? dependencies.addresses.tokens.DAI
      : dependencies.addresses.tokens.USDC

  if (!flashloanTokenAddress) throw new Error('Flashloan token address not found')

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
      flashloanTokenAddress,
      addresses: dependencies.addresses,
      provider: dependencies.provider,
    },
    dependencies.protocolType,
  )

  const {
    aaveFlashloanAssetPriceInEth,
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    reserveDataForFlashloan,
    reserveEModeCategory,
  } = protocolData

  const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(FEE_BASE)

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

  // ETH/DAI
  const ethPerFlashloanAmount = aaveFlashloanAssetPriceInEth

  // EG USDC/ETH
  const ethPerDebtToken = aaveDebtTokenPriceInEth

  if (ethPerDebtToken === undefined) throw new Error('No ETH per debt token found')
  if (ethPerFlashloanAmount === undefined) throw new Error('No ETH per flashloan amount found')

  // EG USDC/ETH divided by ETH/DAI = USDC/ETH times by DAI/ETH = USDC/DAI
  const oracleFLtoDebtToken = ethPerDebtToken.div(ethPerFlashloanAmount)

  if (aaveCollateralTokenPriceInEth === undefined)
    throw new Error('No ETH per collateral token found')
  if (aaveDebtTokenPriceInEth === undefined) throw new Error('No ETH per debt token found')

  // EG STETH/ETH divided by USDC/ETH = STETH/USDC
  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

  const collectFeeFrom = SwapUtils.acceptedFeeToken({
    fromToken: args.debtToken.symbol,
    toToken: args.collateralToken.symbol,
  })

  if (dependencies.addresses.tokens.DAI === undefined) throw new Error('No DAI address found')
  const simulation = currentPosition.adjustToTargetRiskRatio(multiple, {
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
      tokenSymbol: flashloanTokenAddress === dependencies.addresses.tokens.DAI ? 'DAI' : 'USDC',
    },
    depositedByUser: {
      debtInWei: depositDebtAmountInWei,
      collateralInWei: depositCollateralAmountInWei,
    },
    collectSwapFeeFrom: collectFeeFrom,
    debug,
  })

  return {
    simulatedPositionTransition: simulation,
    reserveEModeCategory,
    flashloanTokenAddress,
  }
}
