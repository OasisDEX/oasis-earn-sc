import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import aaveProtocolDataProviderABI from '../../abi/aaveProtocolDataProvider.json'
import { amountFromWei, amountToWei } from '../../helpers'
import { acceptedFeeToken } from '../../helpers/acceptedFeeToken'
import { ADDRESSES } from '../../helpers/addresses'
import { Position } from '../../helpers/calculations/Position'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { TYPICAL_PRECISION, ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { Address } from '../types'
import { AAVETokens } from '../types/aave/tokens'
import { IPositionTransition } from '../types/IPositionTransition'
import { PositionType } from '../types/PositionType'
import { SwapData } from '../types/SwapData'
import { getCurrentPosition } from './getCurrentPosition'

interface OpenPositionArgs {
  depositedByUser?: {
    collateralToken?: { amountInBaseUnit: BigNumber }
    debtToken?: { amountInBaseUnit: BigNumber }
  }
  multiple: BigNumber
  slippage: BigNumber
  positionType: PositionType
  collateralToken: { symbol: AAVETokens; precision?: number }
  debtToken: { symbol: AAVETokens; precision?: number }
}

interface OpenPositionDependencies {
  addresses: AAVEStrategyAddresses
  provider: providers.Provider
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  proxy: Address
  user: Address
  isDPMProxy: boolean
}

export async function open(
  args: OpenPositionArgs,
  dependencies: OpenPositionDependencies,
): Promise<IPositionTransition> {
  const tokenAddresses = {
    WETH: dependencies.addresses.WETH,
    ETH: dependencies.addresses.WETH,
    STETH: dependencies.addresses.STETH,
    USDC: dependencies.addresses.USDC,
    WBTC: dependencies.addresses.WBTC,
  }

  const collateralTokenAddress = tokenAddresses[args.collateralToken.symbol]
  const debtTokenAddress = tokenAddresses[args.debtToken.symbol]

  if (!collateralTokenAddress)
    throw new Error('Collateral token not recognised or address missing in dependencies')
  if (!debtTokenAddress)
    throw new Error('Debt token not recognised or address missing in dependencies')

  /**
   * We've add current Position into all strategy dependencies
   * It turned out that after opening and then closing a position there might be artifacts
   * Left in a position that make it difficult to re-open it
   */
  const currentPosition = await getCurrentPosition(
    {
      collateralToken: args.collateralToken,
      debtToken: args.debtToken,
      proxy: dependencies.proxy,
    },
    {
      addresses: dependencies.addresses,
      provider: dependencies.provider,
    },
  )

  const aavePriceOracle = new ethers.Contract(
    dependencies.addresses.aavePriceOracle,
    aavePriceOracleABI,
    dependencies.provider,
  )

  const aaveProtocolDataProvider = new ethers.Contract(
    dependencies.addresses.aaveProtocolDataProvider,
    aaveProtocolDataProviderABI,
    dependencies.provider,
  )

  // Params
  const slippage = args.slippage
  const estimatedSwapAmount = amountToWei(new BigNumber(1), args.debtToken.precision)

  const [
    aaveFlashloanDaiPriceInEth,
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    reserveDataForFlashloan,
    quoteSwapData,
  ] = await Promise.all([
    aavePriceOracle
      .getAssetPrice(ADDRESSES.main.DAI)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aavePriceOracle
      .getAssetPrice(debtTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aavePriceOracle
      .getAssetPrice(collateralTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aaveProtocolDataProvider.getReserveConfigurationData(ADDRESSES.main.DAI),
    dependencies.getSwapData(
      debtTokenAddress,
      collateralTokenAddress,
      estimatedSwapAmount,
      new BigNumber(slippage),
    ),
  ])

  const BASE = new BigNumber(10000)
  const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(BASE)

  const FEE = 20
  const multiple = args.multiple

  const depositDebtAmountInWei = args.depositedByUser?.debtToken?.amountInBaseUnit || ZERO
  const depositCollateralAmountInWei =
    args.depositedByUser?.collateralToken?.amountInBaseUnit || ZERO

  // Needs to be correct precision. First convert to base 18. Then divide
  const base18FromTokenAmount = amountToWei(
    amountFromWei(quoteSwapData.fromTokenAmount, args.debtToken.precision),
    TYPICAL_PRECISION,
  )
  const base18ToTokenAmount = amountToWei(
    amountFromWei(quoteSwapData.toTokenAmount, args.collateralToken.precision),
    TYPICAL_PRECISION,
  )
  const quoteMarketPrice = base18FromTokenAmount.div(base18ToTokenAmount)
  const flashloanFee = new BigNumber(0)

  // ETH/DAI
  const ethPerDAI = aaveFlashloanDaiPriceInEth

  // EG USDC/ETH
  const ethPerDebtToken = aaveDebtTokenPriceInEth

  // EG USDC/ETH divided by ETH/DAI = USDC/ETH times by DAI/ETH = USDC/DAI
  const oracleFLtoDebtToken = ethPerDebtToken.div(ethPerDAI)

  // EG STETH/ETH divided by USDC/ETH = STETH/USDC
  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

  const collectFeeFrom = acceptedFeeToken({
    fromToken: args.debtToken.symbol,
    toToken: args.collateralToken.symbol,
  })
  const simulatedPositionTransition = currentPosition.adjustToTargetRiskRatio(
    new RiskRatio(multiple, RiskRatio.TYPE.MULITPLE),
    {
      fees: {
        flashLoan: flashloanFee,
        oazo: new BigNumber(FEE),
      },
      prices: {
        market: quoteMarketPrice,
        oracle: oracle,
        oracleFLtoDebtToken: oracleFLtoDebtToken,
      },
      slippage: args.slippage,
      flashloan: {
        maxLoanToValueFL: maxLoanToValueForFL,
        tokenSymbol: 'DAI',
      },
      depositedByUser: {
        debtInWei: depositDebtAmountInWei,
        collateralInWei: depositCollateralAmountInWei,
      },
      collectSwapFeeFrom: collectFeeFrom,
      // debug: true,
    },
  )

  const borrowAmountInWei = simulatedPositionTransition.delta.debt.minus(depositDebtAmountInWei)

  const swapAmountBeforeFees = simulatedPositionTransition.swap.fromTokenAmount
  const swapAmountAfterFees = swapAmountBeforeFees.minus(
    collectFeeFrom === 'sourceToken' ? simulatedPositionTransition.swap.tokenFee : ZERO,
  )

  const swapData = await dependencies.getSwapData(
    debtTokenAddress,
    collateralTokenAddress,
    swapAmountAfterFees,
    slippage,
  )

  // Needs to be correct precision. First convert to base 18. Then divide
  const actualSwapBase18FromTokenAmount = amountToWei(
    amountFromWei(swapData.fromTokenAmount, args.debtToken.precision),
    TYPICAL_PRECISION,
  )
  const toAmountWithMaxSlippage = swapData.minToTokenAmount
  const actualSwapBase18ToTokenAmount = amountToWei(
    amountFromWei(toAmountWithMaxSlippage, args.collateralToken.precision),
    TYPICAL_PRECISION,
  )
  const actualMarketPriceWithSlippage = actualSwapBase18FromTokenAmount.div(
    actualSwapBase18ToTokenAmount,
  )

  const operation = await operations.aave.open({
    deposit: {
      collateralToken: {
        amountInBaseUnit: depositCollateralAmountInWei,
        isEth: args.collateralToken.symbol === 'ETH',
      },
      debtToken: {
        amountInBaseUnit: depositDebtAmountInWei,
        isEth: args.debtToken.symbol === 'ETH',
      },
    },
    swapArgs: {
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      swapAmountInBaseUnit: swapAmountBeforeFees,
      collectFeeFrom,
      receiveAtLeast: swapData.minToTokenAmount,
    },
    positionType: args.positionType,
    addresses: dependencies.addresses,
    flashloanAmount: simulatedPositionTransition.delta.flashloanAmount,
    borrowAmountInBaseUnit: borrowAmountInWei,
    collateralTokenAddress,
    debtTokenAddress,
    useFlashloan: simulatedPositionTransition.flags.requiresFlashloan,
    proxy: dependencies.proxy,
    user: dependencies.user,
    isDPMProxy: dependencies.isDPMProxy,
  })

  // EG FROM WBTC 8 to USDC 6
  // Convert WBTC fromWei
  // Apply market price
  // Convert result back to USDC at precision 6
  const collateralAmountAfterSwapInWei = amountToWei(
    amountFromWei(simulatedPositionTransition.swap.fromTokenAmount, args.debtToken.precision).div(
      actualMarketPriceWithSlippage,
    ),
    args.collateralToken.precision,
  ).integerValue(BigNumber.ROUND_DOWN)

  /*
    Final position calculated using actual swap data and the latest market price
   */
  const finalPosition = new Position(
    simulatedPositionTransition.position.debt,
    {
      amount: collateralAmountAfterSwapInWei.plus(depositCollateralAmountInWei),
      symbol: simulatedPositionTransition.position.collateral.symbol,
      precision: simulatedPositionTransition.position.collateral.precision,
    },
    oracle,
    simulatedPositionTransition.position.category,
  )

  return {
    transaction: {
      calls: operation.calls,
      operationName: operation.operationName,
    },
    simulation: {
      delta: simulatedPositionTransition.delta,
      flags: simulatedPositionTransition.flags,
      swap: {
        ...simulatedPositionTransition.swap,
        ...swapData,
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        actualMarketPriceWithSlippage,
      ),
    },
  }
}
