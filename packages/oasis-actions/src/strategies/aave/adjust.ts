import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import aaveProtocolDataProviderABI from '../../abi/aaveProtocolDataProvider.json'
import { amountFromWei, amountToWei } from '../../helpers'
import { ADDRESSES } from '../../helpers/addresses'
import { IPosition, Position } from '../../helpers/calculations/Position'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { TYPICAL_PRECISION, UNUSED_FLASHLOAN_AMOUNT, ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { AAVETokens } from '../../operations/aave/tokens'
import { IOperation } from '../types/IOperation'
import { IPositionMutation } from '../types/IPositionMutation'
import {
  IMutationDependencies,
  IPositionMutationArgs,
  WithPosition,
} from '../types/IPositionRepository'

export async function adjust(
  args: IPositionMutationArgs<AAVETokens>,
  dependencies: IMutationDependencies<AAVEStrategyAddresses> & WithPosition,
): Promise<IPositionMutation> {
  const { collateralTokenAddress, debtTokenAddress } = getAAVETokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  // Params
  const slippage = args.slippage
  const multiple = args.multiple
  const depositDebtAmountInWei = args.depositedByUser?.debtInWei || ZERO
  const depositCollateralAmountInWei = args.depositedByUser?.collateralInWei || ZERO

  const depositEthWei = args.depositedByUser?.debtInWei || ZERO

  const estimatedSwapAmount = amountToWei(new BigNumber(1))

  const existingBasePosition = dependencies.position

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

  const [
    aaveFlashloanDaiPriceInEth,
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
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
      dependencies.addresses.WETH,
      dependencies.addresses.stETH,
      estimatedSwapAmount,
      new BigNumber(slippage),
    ),
  ])

  const existingPosition = new Position(
    existingBasePosition.debt,
    existingBasePosition.collateral,
    aaveCollateralTokenPriceInEth,
    existingBasePosition.category,
  )

  const FEE = 20
  // const BASE = new BigNumber(10000)
  const flashloanFee = new BigNumber(0)

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

  // ETH/DAI
  const ethPerDAI = aaveFlashloanDaiPriceInEth

  // EG USDC/ETH
  const ethPerDebtToken = aaveDebtTokenPriceInEth

  // EG USDC/ETH divided by ETH/DAI = USDC/ETH times by DAI/ETH = USDC/DAI
  const oracleFLtoDebtToken = ethPerDebtToken.div(ethPerDAI)

  // EG STETH/ETH divided by USDC/ETH = STETH/USDC
  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

  const collectFeeFrom = args.collectSwapFeeFrom ?? 'sourceToken'
  const target = existingPosition.adjustToTargetRiskRatio(
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
        maxLoanToValueFL: existingPosition.category.maxLoanToValue,
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

  let operation: IOperation
  let finalPosition: IPosition
  let actualMarketPriceWithSlippage
  let swapData
  if (target.flags.isIncreasingRisk) {
    const swapAmountBeforeFees = target.swap.fromTokenAmount
    const swapAmountAfterFees = swapAmountBeforeFees.minus(
      collectFeeFrom === 'sourceToken' ? target.swap.tokenFee : ZERO,
    )

    swapData = {
      ...(await dependencies.getSwapData(
        debtTokenAddress,
        collateralTokenAddress,
        swapAmountAfterFees,
        slippage,
      )),
      sourceToken: {
        ...args.debtToken,
        precision: args.debtToken.precision || TYPICAL_PRECISION,
      },
      targetToken: {
        ...args.collateralToken,
        precision: args.collateralToken.precision || TYPICAL_PRECISION,
      },
    }
    actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

    const borrowEthAmountWei = target.delta.debt.minus(depositEthWei)

    const flashloanAmount = target.delta?.flashloanAmount || ZERO

    operation = await operations.aave.increaseMultipleStEth(
      {
        depositCollateral: {
          amountInWei: depositCollateralAmountInWei,
          isEth: args.collateralToken.symbol === 'ETH',
        },
        depositDebtTokens: {
          amountInWei: depositDebtAmountInWei, // Reduces amount of borrowing required
          isEth: args.debtToken.symbol === 'ETH',
        },
        flashloanAmount: flashloanAmount.eq(ZERO) ? UNUSED_FLASHLOAN_AMOUNT : flashloanAmount,
        borrowAmountInWei: borrowEthAmountWei,
        fee: FEE,
        swapData: swapData.exchangeCalldata,
        receiveAtLeast: swapData.minToTokenAmount,
        swapAmountInWei: swapAmountBeforeFees,
        collectFeeFrom: collectFeeFrom,
        collateralTokenAddress,
        debtTokenAddress,
        proxy: dependencies.proxy,
      },
      dependencies.addresses,
    )

    /*
      Final position calculated using actual swap data and the latest market price
    */
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

    finalPosition = new Position(
      target.position.debt,
      {
        amount: collateralAmountAfterSwapInWei
          .plus(depositCollateralAmountInWei)
          .plus(existingPosition.collateral.amount),
        symbol: target.position.collateral.symbol,
      },
      aaveCollateralTokenPriceInEth,
      target.position.category,
    )
  } else {
    swapData = {
      ...(await dependencies.getSwapData(
        collateralTokenAddress,
        debtTokenAddress,
        target.swap.fromTokenAmount.minus(
          collectFeeFrom === 'sourceToken' ? target.swap.tokenFee : ZERO,
        ),
        slippage,
      )),
      sourceToken: {
        ...args.collateralToken,
        precision: args.collateralToken.precision || TYPICAL_PRECISION,
      },
      targetToken: {
        ...args.debtToken,
        precision: args.debtToken.precision || TYPICAL_PRECISION,
      },
    }
    actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

    /*
     * The Maths can produce negative amounts for flashloan on decrease
     * because it's calculated using Debt Delta which will be negative
     */
    const absFlashloanAmount = (target.delta?.flashloanAmount || ZERO).abs()
    // TODO: Precision check here!!
    const withdrawCollateralAmountWei = target.delta.collateral.abs()

    operation = await operations.aave.decreaseMultipleStEth(
      {
        flashloanAmount: absFlashloanAmount.eq(ZERO) ? UNUSED_FLASHLOAN_AMOUNT : absFlashloanAmount,
        withdrawAmount: withdrawCollateralAmountWei,
        fee: FEE,
        swapData: swapData.exchangeCalldata,
        receiveAtLeast: swapData.minToTokenAmount,
        // TODO: Generalise param name
        stEthSwapAmount: target.swap.fromTokenAmount,
        dsProxy: dependencies.proxy,
      },
      dependencies.addresses,
    )

    /*
      Final position calculated using actual swap data and the latest market price
    */
    // EG FROM WBTC 8 to USDC 6
    // Convert WBTC toWei at 18
    // Apply market price
    // Convert result back to USDC at 6
    const debtTokenAmountAfterSwapInWei = amountToWei(
      amountFromWei(
        amountToWei(
          amountFromWei(target.swap.fromTokenAmount, args.collateralToken.precision),
          TYPICAL_PRECISION,
        ).div(actualMarketPriceWithSlippage),
        TYPICAL_PRECISION,
      ),
      args.debtToken.precision,
    ).integerValue(BigNumber.ROUND_DOWN)

    finalPosition = new Position(
      {
        amount: existingPosition.debt.amount
          .minus(depositDebtAmountInWei)
          .minus(debtTokenAmountAfterSwapInWei),
        symbol: target.position.collateral.symbol,
      },
      target.position.collateral,
      aaveCollateralTokenPriceInEth,
      target.position.category,
    )
  }

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
