import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import aaveProtocolDataProviderABI from '../../abi/aaveProtocolDataProvider.json'
import chainlinkPriceFeedABI from '../../abi/chainlinkPriceFeedABI.json'
import { amountFromWei } from '../../helpers'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { Vault } from '../../helpers/calculations/Vault'
import { ZERO } from '../../helpers/constants'
import * as operation from '../../operations'
import type { OpenStEthAddresses } from '../../operations/aave/openStEth'
import { IStrategy } from '../types/IStrategy'
import { SwapData } from '../types/SwapData'

interface OpenStEthArgs {
  depositAmount: BigNumber // in wei
  slippage: BigNumber
  multiple: BigNumber
}

interface OpenStEthDependencies {
  addresses: OpenStEthAddresses
  provider: providers.Provider
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  dsProxy: string
}

export async function openStEth(
  args: OpenStEthArgs,
  dependencies: OpenStEthDependencies,
): Promise<IStrategy> {
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

  const [roundData, decimals, aaveWethPriceInEth, aaveStEthPriceInEth, reserveData, quoteSwapData] =
    await Promise.all([
      priceFeed.latestRoundData(),
      priceFeed.decimals(),
      aavePriceOracle
        .getAssetPrice(dependencies.addresses.WETH)
        .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
      aavePriceOracle
        .getAssetPrice(dependencies.addresses.stETH)
        .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
      aaveProtocolDataProvider.getReserveConfigurationData(dependencies.addresses.stETH),
      dependencies.getSwapData(
        dependencies.addresses.WETH,
        dependencies.addresses.stETH,
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

  const depositEthWei = args.depositAmount
  const stEthPrice = aaveStEthPriceInEth.times(ethPrice.times(aaveWethPriceInEth))

  const emptyVault = new Vault({ amount: ZERO }, { amount: ZERO }, aaveStEthPriceInEth, {
    liquidationThreshold,
    maxLoanToValue,
    dustLimit,
  })

  const quoteMarketPrice = quoteSwapData.fromTokenAmount.div(quoteSwapData.toTokenAmount)

  const flashloanFee = new BigNumber(0)

  const target = emptyVault.adjustToTargetRiskRatio(
    new RiskRatio(multiple, RiskRatio.TYPE.MULITPLE),
    {
      fees: {
        flashLoan: flashloanFee,
        oazo: new BigNumber(FEE),
      },
      prices: {
        market: quoteMarketPrice,
        oracle: aaveStEthPriceInEth,
        oracleFLtoDebtToken: ethPrice,
      },
      slippage: args.slippage,
      maxLoanToValueFL: emptyVault.category.maxLoanToValue,
      depositedByUser: {
        debt: args.depositAmount,
      },
      // debug: true,
    },
  )

  const borrowEthAmountWei = target.delta.debt.minus(depositEthWei)

  const swapData = await dependencies.getSwapData(
    dependencies.addresses.WETH,
    dependencies.addresses.stETH,
    target.swap.fromTokenAmount,
    slippage,
  )

  const actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)

  const calls = await operation.aave.openStEth(
    {
      // depositAmount: depositEthWei,
      flashloanAmount: target.delta?.flashloanAmount || ZERO,
      borrowAmount: borrowEthAmountWei,
      fee: FEE,
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      ethSwapAmount: target.swap.fromTokenAmount,
      dsProxy: dependencies.dsProxy,
    },
    dependencies.addresses,
  )

  const stEthAmountAfterSwapWei = target.swap.fromTokenAmount.div(actualMarketPriceWithSlippage)

  /*
    Final vault calculated using actual swap data and the latest market price
   */
  const finalVault = new Vault(
    target.vault.debt,
    { amount: stEthAmountAfterSwapWei, denomination: target.vault.collateral.denomination },
    aaveStEthPriceInEth,
    target.vault.category,
  )

  const prices = {
    debtTokenPrice: ethPrice,
    collateralTokenPrices: stEthPrice,
  }

  return {
    calls,
    simulation: {
      delta: target.delta,
      flags: target.flags,
      swap: {
        ...target.swap,
        ...swapData,
        fee: amountFromWei(target.swap.fee),
      },
      vault: finalVault,
      minConfigurableRiskRatio: finalVault.minConfigurableRiskRatio(actualMarketPriceWithSlippage),
      prices,
    },
  }
}
