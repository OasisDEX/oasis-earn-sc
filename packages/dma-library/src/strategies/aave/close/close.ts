import aavePriceOracleABI from '@abis/external/protocols/aave/v2/priceOracle.json'
import aaveProtocolDataProviderABI from '@abis/external/protocols/aave/v2/protocolDataProvider.json'
import aaveV3PriceOracleABI from '@abis/external/protocols/aave/v3/aaveOracle.json'
import aaveV3ProtocolDataProviderABI from '@abis/external/protocols/aave/v3/aaveProtocolDataProvider.json'
import { getForkedNetwork } from '@deploy-configurations/utils/network'
import {
  FEE_BASE,
  FEE_ESTIMATE_INFLATOR,
  ONE,
  TYPICAL_PRECISION,
  ZERO,
} from '@dma-common/constants'
import { calculateFee } from '@dma-common/utils/swap'
import { operations } from '@dma-library/operations'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import { AaveVersion } from '@dma-library/strategies/aave'
import { getAaveTokenAddresses } from '@dma-library/strategies/aave/get-aave-token-addresses'
import * as StrategiesCommon from '@dma-library/strategies/common'
import {
  IBasePositionTransitionArgs,
  IOperation,
  IPositionTransitionDependencies,
  PositionTransition,
  PositionType,
  SwapData,
  WithLockedCollateral,
} from '@dma-library/types'
import { AAVETokens } from '@dma-library/types/aave'
import { resolveFlashloanProvider } from '@dma-library/utils/flashloan/resolve-provider'
import { feeResolver } from '@dma-library/utils/swap/fee-resolver'
import { Amount, Position } from '@domain'
import { FLASHLOAN_SAFETY_MARGIN } from '@domain/constants'
import { Provider } from '@ethersproject/providers'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type AaveCloseArgs = IBasePositionTransitionArgs<AAVETokens> & {
  positionType: PositionType
} & WithLockedCollateral & {
    shouldCloseToCollateral?: boolean
  }

type WithVersioning = {
  protocolVersion: AaveVersion
}

type AaveCloseArgsWithVersioning = AaveCloseArgs & WithVersioning

export type AaveCloseDependencies =
  | IPositionTransitionDependencies<AAVEStrategyAddresses>
  | IPositionTransitionDependencies<AAVEV3StrategyAddresses>

export async function close(
  args: AaveCloseArgsWithVersioning,
  dependencies: AaveCloseDependencies,
): Promise<PositionTransition> {
  const getSwapData = args.shouldCloseToCollateral
    ? getAaveSwapDataToCloseToCollateral
    : getAaveSwapDataToCloseToDebt

  const { swapData, collectFeeFrom, preSwapFee$ } = await getSwapData(args, dependencies)

  const operation = await buildOperation(
    { ...swapData, collectFeeFrom, preSwapFee$ },
    args,
    dependencies,
  )

  return generateTransition(swapData, collectFeeFrom, preSwapFee$, operation, args, dependencies)
}

async function getAaveSwapDataToCloseToCollateral(
  { debtToken, collateralToken, slippage, protocolVersion }: AaveCloseArgsWithVersioning,
  dependencies: AaveCloseDependencies,
) {
  const { addresses } = dependencies
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken, collateralToken },
    addresses,
  )

  // Since we cannot get the exact amount that will be needed
  // to cover all debt, there will be left overs of the debt token
  // which will then have to be transferred back to the user
  const [, colPrice, debtPrice] = (
    await getValuesFromProtocol(
      protocolVersion,
      collateralTokenAddress,
      debtTokenAddress,
      dependencies,
    )
  ).map(price => {
    return new BigNumber(price.toString())
  })

  const collateralTokenWithAddress = {
    ...collateralToken,
    precision: collateralToken.precision || TYPICAL_PRECISION,
    address: collateralTokenAddress,
  }
  const debtTokenWithAddress = {
    ...debtToken,
    precision: debtToken.precision || TYPICAL_PRECISION,
    address: debtTokenAddress,
  }

  return await StrategiesCommon.getSwapDataForCloseToCollateral({
    collateralToken: collateralTokenWithAddress,
    debtToken: debtTokenWithAddress,
    colPrice,
    debtPrice,
    outstandingDebt$: dependencies.currentPosition.debt.amount,
    slippage,
    ETHAddress: addresses.ETH,
    getSwapData: dependencies.getSwapData,
  })
}

async function getAaveSwapDataToCloseToDebt(
  { debtToken, collateralToken, slippage, collateralAmountLockedInProtocolInWei }: AaveCloseArgs,
  dependencies: AaveCloseDependencies,
) {
  const { addresses } = dependencies
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken, collateralToken },
    addresses,
  )

  const swapAmountBeforeFees$ = collateralAmountLockedInProtocolInWei
  const fromToken = {
    ...collateralToken,
    precision: collateralToken.precision || TYPICAL_PRECISION,
    address: collateralTokenAddress,
  }
  const toToken = {
    ...debtToken,
    precision: debtToken.precision || TYPICAL_PRECISION,
    address: debtTokenAddress,
  }

  return StrategiesCommon.getSwapDataForCloseToDebt({
    fromToken,
    toToken,
    slippage,
    swapAmountBeforeFees$,
    getSwapData: dependencies.getSwapData,
  })
}

async function buildOperation(
  swapData: SwapData & {
    collectFeeFrom: 'sourceToken' | 'targetToken'
    preSwapFee$: BigNumber
  },
  args: AaveCloseArgsWithVersioning,
  dependencies: AaveCloseDependencies,
): Promise<IOperation> {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const [aaveFlashloanDaiPriceInEth, aaveCollateralTokenPriceInEth, , reserveDataForFlashloan] =
    await getValuesFromProtocol(
      args.protocolVersion,
      collateralTokenAddress,
      debtTokenAddress,
      dependencies,
    )

  /* Calculate Amount to flashloan */
  const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(FEE_BASE)
  const ethPerDAI = new BigNumber(aaveFlashloanDaiPriceInEth.toString())
  const ethPerCollateralToken = new BigNumber(aaveCollateralTokenPriceInEth.toString())
  // EG STETH/ETH divided by ETH/DAI = STETH/ETH times by DAI/ETH = STETH/DAI
  const oracleFLtoCollateralToken = ethPerCollateralToken.div(ethPerDAI)

  // const amountToFlashloan$ = amountToWei(
  //   amountFromWei(args.collateralAmountLockedInProtocolInWei, args.collateralToken.precision).times(
  //     oracleFLtoCollateralToken,
  //   ),
  //   18,
  // )
  const amountToFlashloan$ = new Amount({
    amount: args.collateralAmountLockedInProtocolInWei,
    precision: {
      mode: 'tokenMax',
      tokenMaxDecimals: args.collateralToken.precision,
    },
  })
    .switchPrecisionMode('none')
    .times(oracleFLtoCollateralToken)
    .switchPrecisionMode('tokenMax')
    .div(maxLoanToValueForFL.times(ONE.minus(FLASHLOAN_SAFETY_MARGIN)))
    .integerValue(BigNumber.ROUND_DOWN)

  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol)
  const collateralAmountToBeSwapped = args.shouldCloseToCollateral
    ? swapData.fromTokenAmount.plus(swapData.preSwapFee$)
    : args.collateralAmountLockedInProtocolInWei
  const collectFeeFrom = swapData.collectFeeFrom
  if (args.protocolVersion === AaveVersion.v2) {
    const closeArgs = {
      // In the close to collateral scenario we need to add the preSwapFee amount to the fromTokenAmount
      // So, that when taking the fee from the source token we are sending the Swap contract
      // the sum of the fee and the ultimately fromAmount that will be swapped
      collateralAmountToBeSwapped,
      // flashloanAmount: amountToFlashloan$,
      flashloanAmount: amountToFlashloan$.toBigNumber(),
      fee: fee.toNumber(),
      swapData: swapData.exchangeCalldata,
      receiveAtLeast: swapData.minToTokenAmount,
      proxy: dependencies.proxy,
      collectFeeFrom,
      collateralTokenAddress,
      collateralIsEth: args.collateralToken.symbol === 'ETH',
      debtTokenAddress,
      debtTokenIsEth: args.debtToken.symbol === 'ETH',
      isDPMProxy: dependencies.isDPMProxy,
    }
    return await operations.aave.v2.close(
      closeArgs,
      dependencies.addresses as AAVEStrategyAddresses,
    )
  }
  if (args.protocolVersion === AaveVersion.v3) {
    const flashloanProvider = resolveFlashloanProvider(
      await getForkedNetwork(dependencies.provider),
    )

    const closeArgs = {
      collateral: {
        address: collateralTokenAddress,
        isEth: args.collateralToken.symbol === 'ETH',
      },
      debt: {
        address: debtTokenAddress,
        isEth: args.debtToken.symbol === 'ETH',
      },
      swap: {
        fee: fee.toNumber(),
        data: swapData.exchangeCalldata,
        amount: collateralAmountToBeSwapped,
        collectFeeFrom,
        receiveAtLeast: swapData.minToTokenAmount,
      },
      flashloan: {
        amount: amountToFlashloan$.toBigNumber(),
        provider: flashloanProvider,
      },
      position: {
        type: args.positionType,
        collateral: { amount: collateralAmountToBeSwapped },
      },
      proxy: {
        address: dependencies.proxy,
        isDPMProxy: dependencies.isDPMProxy,
        owner: dependencies.user,
      },
      addresses: dependencies.addresses as AAVEV3StrategyAddresses,
    }

    return await operations.aave.v3.close(closeArgs)
  }

  throw new Error('Unsupported AAVE version')
}

async function generateTransition(
  swapData: SwapData,
  collectFeeFrom: 'sourceToken' | 'targetToken',
  preSwapFee$: BigNumber,
  operation: IOperation,
  args: AaveCloseArgsWithVersioning,
  dependencies: AaveCloseDependencies,
) {
  const currentPosition = dependencies.currentPosition
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const [, aaveCollateralTokenPriceInEth, aaveDebtTokenPriceInEth] = await getValuesFromProtocol(
    args.protocolVersion,
    collateralTokenAddress,
    debtTokenAddress,
    dependencies,
  )
  /*
  Final position calculated using actual swap data and the latest market price
 */
  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)
  const finalPosition = new Position(
    { amount: ZERO, symbol: currentPosition.debt.symbol },
    { amount: ZERO, symbol: currentPosition.collateral.symbol },
    oracle,
    currentPosition.category,
  )

  const flags = { requiresFlashloan: true, isIncreasingRisk: false }

  // We need to estimate the fee due when collecting from the target token
  // We use the toTokenAmount given it's the most optimistic swap scenario
  // Meaning it corresponds with the largest fee a user can expect to pay
  // Thus, if the swap performs poorly the fee will be less than expected
  const fromTokenAmountNormalised$$ = new Amount({
    amount: swapData.fromTokenAmount,
    precision: {
      mode: 'tokenMax',
      tokenMaxDecimals: args.collateralToken.precision,
    },
  }).switchPrecisionMode('normalized')
  const toTokenAmountNormalisedWithMaxSlippage$$ = new Amount({
    amount: swapData.minToTokenAmount,
    precision: {
      mode: 'tokenMax',
      tokenMaxDecimals: args.debtToken.precision,
    },
  }).switchPrecisionMode('normalized')

  const expectedMarketPriceWithSlippage = fromTokenAmountNormalised$$
    .div(toTokenAmountNormalisedWithMaxSlippage$$)
    .toBigNumber()
  const fee = feeResolver(args.collateralToken.symbol, args.debtToken.symbol)

  const postSwapFee$ =
    collectFeeFrom === 'targetToken' ? calculateFee(swapData.toTokenAmount, fee.toNumber()) : ZERO

  return {
    transaction: {
      calls: operation.calls,
      operationName: operation.operationName,
    },
    simulation: {
      delta: {
        debt: currentPosition.debt.amount.negated(),
        collateral: currentPosition.collateral.amount.negated(),
        flashloanAmount: ZERO,
      },
      flags: flags,
      swap: {
        ...swapData,
        tokenFee: preSwapFee$.plus(
          postSwapFee$.times(ONE.plus(FEE_ESTIMATE_INFLATOR)).integerValue(BigNumber.ROUND_DOWN),
        ),
        collectFeeFrom,
        sourceToken: {
          symbol: args.collateralToken.symbol,
          precision: args.collateralToken.precision ?? TYPICAL_PRECISION,
        },
        targetToken: {
          symbol: args.debtToken.symbol,
          precision: args.debtToken.precision ?? TYPICAL_PRECISION,
        },
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        expectedMarketPriceWithSlippage,
      ),
    },
  }
}

async function getValuesFromProtocol(
  protocolVersion: AaveVersion,
  collateralTokenAddress: string,
  debtTokenAddress: string,
  dependencies: AaveCloseDependencies,
) {
  /* Grabs all the protocol level services we need to resolve values */
  const { aavePriceOracle, aaveProtocolDataProvider } = getAAVEProtocolServices(
    protocolVersion,
    dependencies.provider,
    dependencies.addresses,
  )

  // TODO: Add memoization
  async function getAllAndMemoize() {
    return Promise.all([
      aavePriceOracle.getAssetPrice(dependencies.addresses.DAI),
      aavePriceOracle.getAssetPrice(collateralTokenAddress),
      aavePriceOracle.getAssetPrice(debtTokenAddress),
      aaveProtocolDataProvider.getReserveConfigurationData(dependencies.addresses.DAI),
    ])
  }

  return getAllAndMemoize()
}

function getAAVEProtocolServices(
  protocolVersion: AaveVersion,
  provider: Provider,
  addresses: AAVEStrategyAddresses | AAVEV3StrategyAddresses,
) {
  switch (protocolVersion) {
    case AaveVersion.v2:
      return {
        aavePriceOracle: new ethers.Contract(
          (addresses as AAVEStrategyAddresses).priceOracle,
          aavePriceOracleABI,
          provider,
        ),
        aaveProtocolDataProvider: new ethers.Contract(
          (addresses as AAVEStrategyAddresses).protocolDataProvider,
          aaveProtocolDataProviderABI,
          provider,
        ),
      }
    case AaveVersion.v3:
      return {
        aavePriceOracle: new ethers.Contract(
          (addresses as AAVEV3StrategyAddresses).aaveOracle,
          aaveV3PriceOracleABI,
          provider,
        ),
        aaveProtocolDataProvider: new ethers.Contract(
          (addresses as AAVEV3StrategyAddresses).poolDataProvider,
          aaveV3ProtocolDataProviderABI,
          provider,
        ),
      }
    default:
      throw new Error('Unsupported AAVE Version')
  }
}
