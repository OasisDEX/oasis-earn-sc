import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import aaveProtocolDataProviderABI from '../../abi/aaveProtocolDataProvider.json'
import { amountFromWei, amountToWei } from '../../helpers'
import { ADDRESSES } from '../../helpers/addresses'
import { Position } from '../../helpers/calculations/Position'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { TYPICAL_PRECISION, ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { AAVETokens } from '../../operations/aave/tokens'
import { IMutationDependencies, IPositionTransitionArgs } from '../types/IPositionRepository'
import { IPositionTransition } from '../types/IPositionTransition'

export async function open(
  args: IPositionTransitionArgs<AAVETokens>,
  dependencies: IMutationDependencies<AAVEStrategyAddresses>,
): Promise<IPositionTransition> {
  const tokenAddresses = {
    WETH: dependencies.addresses.WETH,
    ETH: dependencies.addresses.WETH,
    STETH: dependencies.addresses.stETH,
    USDC: dependencies.addresses.USDC,
    WBTC: dependencies.addresses.wBTC,
  }

  const collateralTokenAddress = tokenAddresses[args.collateralToken.symbol]
  const debtTokenAddress = tokenAddresses[args.debtToken.symbol]

  if (!collateralTokenAddress)
    throw new Error('Collateral token not recognised or address missing in dependencies')
  if (!debtTokenAddress)
    throw new Error('Debt token not recognised or address missing in dependencies')

  const currentPosition = dependencies.currentPosition
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

  const slippage = args.slippage
  const estimatedSwapAmount = amountToWei(new BigNumber(1))

  const [
    aaveFlashloanDaiPriceInEth,
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    reserveDataForCollateral,
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
    aaveProtocolDataProvider.getReserveConfigurationData(collateralTokenAddress),
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

  // TODO: Read it from blockchain if AAVE introduces a dust limit
  const dustLimit = new BigNumber(0)

  const FEE = 20
  const multiple = args.multiple

  const depositDebtAmountInWei = args.depositedByUser?.debtInWei || ZERO
  const depositCollateralAmountInWei = args.depositedByUser?.collateralInWei || ZERO

  // Needs to be correct precision. First convert to base 18. Then divide
  const base18FromTokenAmount = amountToWei(
    amountFromWei(quoteSwapData.fromTokenAmount, args.debtToken.precision),
    18,
  )
  const base18ToTokenAmount = amountToWei(
    amountFromWei(quoteSwapData.toTokenAmount, args.collateralToken.precision),
    18,
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

  const collectFeeFrom = args.collectSwapFeeFrom ?? 'sourceToken'
  const target = currentPosition.adjustToTargetRiskRatio(
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

  const borrowAmountInWei = target.delta.debt.minus(depositDebtAmountInWei)

  const precisionAdjustedBorrowAmount = amountToWei(
    amountFromWei(borrowAmountInWei),
    args.debtToken.precision || TYPICAL_PRECISION,
  )

  const swapAmountBeforeFees = target.swap.fromTokenAmount
  const swapAmountAfterFees = swapAmountBeforeFees.minus(
    collectFeeFrom === 'sourceToken' ? target.swap.tokenFee : ZERO,
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
    18,
  )
  const actualSwapBase18ToTokenAmount = amountToWei(
    amountFromWei(swapData.toTokenAmount, args.collateralToken.precision),
    18,
  )
  const actualMarketPriceWithSlippage = actualSwapBase18FromTokenAmount.div(
    actualSwapBase18ToTokenAmount,
  )

  const operation = await operations.aave.open(
    {
      depositCollateral: {
        amountInWei: depositCollateralAmountInWei,
        isEth: args.collateralToken.symbol === 'ETH',
      },
      depositDebtTokens: {
        amountInWei: depositDebtAmountInWei, // Reduces amount of borrowing required
        isEth: args.debtToken.symbol === 'ETH',
      },
      flashloanAmount: target.delta.flashloanAmount,
      borrowAmountInWei: precisionAdjustedBorrowAmount, // This is the amount that should be correct precision
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      swapAmountInWei: swapAmountBeforeFees,
      collectFeeFrom: collectFeeFrom,
      collateralTokenAddress,
      debtTokenAddress,
      proxy: dependencies.proxy,
      user: dependencies.user,
    },
    dependencies.addresses,
  )

  // EG FROM WBTC 8 to USDC 6
  // Convert WBTC toWei at 18
  // Apply market price
  // Convert result back to USDC at 6
  const collateralAmountAfterSwapInWei = amountToWei(
    amountFromWei(
      amountToWei(
        amountFromWei(target.swap.fromTokenAmount, args.debtToken.precision),
        TYPICAL_PRECISION,
      ).div(actualMarketPriceWithSlippage),
      TYPICAL_PRECISION,
    ),
    args.collateralToken.precision,
  ).integerValue(BigNumber.ROUND_DOWN)

  /*
    Final position calculated using actual swap data and the latest market price
   */
  const finalPosition = new Position(
    target.position.debt,
    {
      amount: collateralAmountAfterSwapInWei.plus(depositCollateralAmountInWei),
      symbol: target.position.collateral.symbol,
      precision: target.position.collateral.precision,
    },
    oracle,
    target.position.category,
  )

  return {
    transaction: {
      calls: operation.calls,
      operationName: operation.operationName,
    },
    simulation: {
      delta: target.delta,
      flags: target.flags,
      swap: {
        ...target.swap,
        ...swapData,
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        actualMarketPriceWithSlippage,
      ),
    },
  }
}
