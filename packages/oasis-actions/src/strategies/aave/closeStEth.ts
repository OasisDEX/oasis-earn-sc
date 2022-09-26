import BigNumber from 'bignumber.js'
import { ethers, providers } from 'ethers'

import aavePriceOracleABI from '../../abi/aavePriceOracle.json'
import chainlinkPriceFeedABI from '../../abi/chainlinkPriceFeedABI.json'
import { amountFromWei, calculateFee } from '../../helpers'
import { IBaseVault, Vault } from '../../helpers/calculations/Vault'
import { ZERO } from '../../helpers/constants'
import * as operation from '../../operations'
import type { CloseStEthAddresses } from '../../operations/aave/closeStEth'
import { IStrategy } from '../types/IStrategy'

interface SwapData {
  fromTokenAddress: string
  toTokenAddress: string
  fromTokenAmount: BigNumber
  toTokenAmount: BigNumber
  minToTokenAmount: BigNumber
  exchangeCalldata: string | number
}

interface CloseStEthArgs {
  stEthAmountLockedInAave: BigNumber
  slippage: BigNumber
}

interface CloseStEthDependencies {
  addresses: CloseStEthAddresses
  provider: providers.Provider
  vault: IBaseVault
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  dsProxy: string
}

export async function closeStEth(
  args: CloseStEthArgs,
  dependencies: CloseStEthDependencies,
): Promise<IStrategy> {
  const existingVault = dependencies.vault

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

  const [roundData, decimals, aaveWethPriceInEth, aaveStEthPriceInEth, swapData] =
    await Promise.all([
      priceFeed.latestRoundData(),
      priceFeed.decimals(),
      aavePriceOracle
        .getAssetPrice(dependencies.addresses.WETH)
        .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
      aavePriceOracle
        .getAssetPrice(dependencies.addresses.stETH)
        .then((amount: ethers.BigNumberish) => amountFromWei(new BigNumber(amount.toString()))),
      dependencies.getSwapData(
        dependencies.addresses.stETH,
        dependencies.addresses.WETH,
        args.stEthAmountLockedInAave,
        args.slippage,
      ),
    ])

  const ethPrice = new BigNumber(roundData.answer.toString() / Math.pow(10, decimals))
  const FEE = 20
  const FEE_BASE = 10000

  const stEthPrice = aaveStEthPriceInEth.times(ethPrice.times(aaveWethPriceInEth))

  const flashLoanAmountWei = args.stEthAmountLockedInAave.times(stEthPrice)

  const fee = calculateFee(swapData.toTokenAmount, FEE, FEE_BASE)

  const actualMarketPriceWithSlippage = swapData.fromTokenAmount.div(swapData.minToTokenAmount)
  // TODO: We might want to return this and update ISimulation accordingly
  // const ethAmountAfterSwapWei = swapData.minToTokenAmount

  const calls = await operation.aave.closeStEth(
    {
      stEthAmount: args.stEthAmountLockedInAave,
      flashloanAmount: flashLoanAmountWei,
      fee: FEE,
      swapData: 0,
      receiveAtLeast: new BigNumber(0),
      dsProxy: dependencies.dsProxy,
    },
    dependencies.addresses,
  )

  /*
  Final vault calculated using actual swap data and the latest market price
 */
  const finalPosition = new Vault(
    { amount: ZERO, denomination: existingVault.debt.denomination },
    { amount: ZERO, denomination: existingVault.collateral.denomination },
    aaveStEthPriceInEth,
    existingVault.category,
  )

  const prices = {
    debtTokenPrice: ethPrice,
    collateralTokenPrices: stEthPrice,
  }

  const flags = { usesFlashloan: true, isIncreasingRisk: false }

  return {
    calls,
    simulation: {
      delta: {
        debt: existingVault.debt.amount.negated(),
        collateral: existingVault.collateral.amount.negated(),
      },
      flags: flags,
      swap: {
        ...swapData,
        fee: amountFromWei(fee),
      },
      vault: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        actualMarketPriceWithSlippage,
      ),
      prices,
    },
  }
}
