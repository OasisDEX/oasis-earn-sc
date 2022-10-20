import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import aaveProtocolDataProviderABI from '../../abi/aaveProtocolDataProvider.json'
import chainlinkPriceFeedABI from '../../abi/chainlinkPriceFeedABI.json'
import { amountFromWei } from '../../helpers'
import { Position } from '../../helpers/calculations/Position'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { UNUSED_FLASHLOAN_AMOUNT, ZERO } from '../../helpers/constants'
import * as operation from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { AAVETokens } from '../../operations/aave/tokens'
import { IPositionMutation } from '../types/IPositionMutation'
import { IMutationDependencies, IPositionMutationArgs } from '../types/IPositionRepository'

export async function open(
  args: IPositionMutationArgs<AAVETokens>,
  dependencies: IMutationDependencies<AAVEStrategyAddresses>,
): Promise<IPositionMutation> {
  const tokenAddresses = {
    WETH: dependencies.addresses.WETH,
    ETH: dependencies.addresses.WETH,
    STETH: dependencies.addresses.stETH,
  }

  const collateralTokenAddress = tokenAddresses[args.collateralToken]
  const debtTokenAddress = tokenAddresses[args.debtToken]

  if (!collateralTokenAddress)
    throw new Error('Collateral token not recognised or address missing in dependencies')
  if (!debtTokenAddress)
    throw new Error('Debt token not recognised or address missing in dependencies')

  const priceFeed = new ethers.Contract(
    dependencies.addresses.chainlinkEthUsdPriceFeed,
    chainlinkPriceFeedABI,
    dependencies.provider,
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

  const slippage = args.slippage
  const estimatedSwapAmount = new BigNumber(1)

  const [
    roundData,
    decimals,
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    reserveData,
    quoteSwapData,
  ] = await Promise.all([
    priceFeed.latestRoundData(),
    priceFeed.decimals(),
    aavePriceOracle
      .getAssetPrice(debtTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aavePriceOracle
      .getAssetPrice(collateralTokenAddress)
      .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
    aaveProtocolDataProvider.getReserveConfigurationData(collateralTokenAddress),
    dependencies.getSwapData(
      debtTokenAddress,
      collateralTokenAddress,
      estimatedSwapAmount,
      new BigNumber(slippage),
    ),
  ])

  const ethPrice = new BigNumber(roundData.answer.toString() / Math.pow(10, decimals))

  const BASE = new BigNumber(10000)
  const liquidationThreshold = new BigNumber(reserveData.liquidationThreshold.toString()).div(BASE)
  const maxLoanToValue = new BigNumber(reserveData.ltv.toString()).div(BASE)

  // TODO: Read it from blockchain if AAVE introduces a dust limit
  const dustLimit = new BigNumber(0)

  const FEE = 20

  const multiple = args.multiple

  const depositEthWei = args.depositAmountInWei
  const collateralPrice = aaveCollateralTokenPriceInEth.times(
    ethPrice.times(aaveDebtTokenPriceInEth),
  )

  const emptyPosition = new Position(
    { amount: ZERO },
    { amount: ZERO },
    aaveCollateralTokenPriceInEth,
    {
      liquidationThreshold,
      maxLoanToValue,
      dustLimit,
    },
  )

  const quoteMarketPrice = quoteSwapData.fromTokenAmount.div(quoteSwapData.toTokenAmount)

  const flashloanFee = new BigNumber(0)

  const target = emptyPosition.adjustToTargetRiskRatio(
    new RiskRatio(multiple, RiskRatio.TYPE.MULITPLE),
    {
      fees: {
        flashLoan: flashloanFee,
        oazo: new BigNumber(FEE),
      },
      prices: {
        market: quoteMarketPrice,
        oracle: aaveCollateralTokenPriceInEth,
        oracleFLtoDebtToken: ethPrice,
      },
      slippage: args.slippage,
      maxLoanToValueFL: emptyPosition.category.maxLoanToValue,
      depositedByUser: {
        debt: args.depositAmountInWei,
      },
      collectSwapFeeFrom: 'sourceToken',
      // debug: true,
    },
  )

  const borrowEthAmountInWei = target.delta.debt.minus(depositEthWei)

  const swapData = await dependencies.getSwapData(
    debtTokenAddress,
    collateralTokenAddress,
    target.swap.fromTokenAmount.minus(target.swap.sourceTokenFee),
    slippage,
  )

  const actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

  const calls = await operation.aave.openStEth(
    {
      flashloanAmount: target.delta?.flashloanAmount || UNUSED_FLASHLOAN_AMOUNT,
      borrowAmount: borrowEthAmountInWei,
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      ethSwapAmount: target.swap.fromTokenAmount,
      dsProxy: dependencies.proxy,
    },
    dependencies.addresses,
  )

  const stEthAmountAfterSwapWei = target.swap.fromTokenAmount.div(actualMarketPriceWithSlippage)

  /*
    Final position calculated using actual swap data and the latest market price
   */
  const finalPosition = new Position(
    target.position.debt,
    { amount: stEthAmountAfterSwapWei, denomination: target.position.collateral.denomination },
    aaveCollateralTokenPriceInEth,
    target.position.category,
  )

  const prices = {
    debtTokenPrice: ethPrice,
    collateralTokenPrices: collateralPrice,
  }

  return {
    calls,
    simulation: {
      delta: target.delta,
      flags: target.flags,
      swap: {
        ...target.swap,
        ...swapData,
        sourceTokenFee: amountFromWei(target.swap.sourceTokenFee),
        targetTokenFee: amountFromWei(target.swap.targetTokenFee),
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        actualMarketPriceWithSlippage,
      ),
      prices,
    },
  }
}
