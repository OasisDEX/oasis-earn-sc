import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { getForkedNetwork } from '@deploy-configurations/utils/network'
import {
  DEFAULT_FEE,
  FEE_BASE,
  FEE_ESTIMATE_INFLATOR,
  NO_FEE,
  ONE,
  ZERO,
} from '@dma-common/constants'
import { Unbox } from '@dma-common/types/common'
import { amountFromWei, amountToWei } from '@dma-common/utils/common'
import { calculateFee } from '@dma-common/utils/swap'
import { AAVEStrategyAddresses, AAVEV3StrategyAddresses, operations } from '@dma-library/operations'
import { OpenOperationArgs } from '@dma-library/operations/aave/v3/open'
import { AaveProtocolData } from '@dma-library/protocols/aave/get-aave-protocol-data'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { getAaveTokenAddress, getAaveTokenAddresses } from '@dma-library/strategies/aave/common'
import { IOperation, PositionTransition, PositionType, SwapData } from '@dma-library/types'
import { AAVETokens, AaveVersion } from '@dma-library/types/aave'
import { WithV2Addresses, WithV3Addresses } from '@dma-library/types/aave/addresses'
import { WithFee } from '@dma-library/types/aave/fee'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import { resolveFlashloanProvider } from '@dma-library/utils/flashloan/resolve-provider'
import * as SwapUtils from '@dma-library/utils/swap'
import { IBaseSimulatedTransition, IRiskRatio, Position } from '@domain'
import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

export interface AaveOpenArgs {
  depositedByUser?: {
    collateralToken?: { amountInBaseUnit: BigNumber }
    debtToken?: { amountInBaseUnit: BigNumber }
  }
  multiple: IRiskRatio
  slippage: BigNumber
  positionType: PositionType
  collateralToken: { symbol: AAVETokens; precision?: number }
  debtToken: { symbol: AAVETokens; precision?: number }
}

export interface AaveOpenSharedDependencies {
  proxy: Address
  user: Address
  isDPMProxy: boolean
  /* Services below 👇*/
  provider: providers.Provider
  network: Network
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
}

export type AaveV2OpenDependencies = AaveOpenSharedDependencies & WithV2Addresses & WithV2Protocol
export type AaveV3OpenDependencies = AaveOpenSharedDependencies & WithV3Addresses & WithV3Protocol
export type AaveOpenDependencies = AaveV2OpenDependencies | AaveV3OpenDependencies

export async function open(
  args: AaveOpenArgs,
  dependencies: AaveOpenDependencies,
): Promise<PositionTransition> {
  const fee = SwapUtils.feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk: true,
    isEarnPosition: args.positionType === 'Earn',
  })
  const estimatedSwapAmount = amountToWei(new BigNumber(1), args.debtToken.precision)
  const { swapData: quoteSwapData } = await SwapUtils.getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    args: {
      fromToken: args.debtToken,
      toToken: args.collateralToken,
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees: estimatedSwapAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddress: getAaveTokenAddress,
    },
  })

  const { simulatedPositionTransition, reserveEModeCategory, flashloanTokenAddress } =
    await simulatePositionTransition(
      quoteSwapData,
      {
        ...args,
        fee,
      },
      dependencies,
      // true,
    )

  const { swapData, collectFeeFrom } = await SwapUtils.getSwapDataHelper<
    typeof dependencies.addresses,
    AAVETokens
  >({
    args: {
      fromToken: args.debtToken,
      toToken: args.collateralToken,
      slippage: args.slippage,
      fee,
      swapAmountBeforeFees: simulatedPositionTransition.swap.fromTokenAmount,
    },
    addresses: dependencies.addresses,
    services: {
      getSwapData: dependencies.getSwapData,
      getTokenAddress: getAaveTokenAddress,
    },
  })

  const operation = await buildOperation(
    swapData,
    simulatedPositionTransition,
    collectFeeFrom,
    reserveEModeCategory,
    { ...args, flashloanToken: flashloanTokenAddress },
    dependencies,
  )

  if (operation === undefined) throw new Error('No operation built. Check your arguments.')

  return await generateTransition({
    swapData,
    operation,
    args,
    collectFeeFrom,
    fee,
    dependencies,
    simulatedPositionTransition,
    quoteSwapData,
  })
}

async function simulatePositionTransition(
  quoteSwapData: SwapData,
  args: AaveOpenArgs & WithFee,
  dependencies: AaveOpenDependencies,
  debug?: boolean,
) {
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const flashloanTokenAddress =
    dependencies.network === Network.MAINNET
      ? dependencies.addresses.DAI
      : dependencies.addresses.USDC

  /**
   * We've add current Position into all strategy dependencies
   * It turned out that after opening and then closing a position there might be artifacts
   * Left in a position that make it difficult to re-open it
   */
  let currentPosition: Position | undefined
  let protocolData: Unbox<AaveProtocolData> | undefined
  if (AaveCommon.isV2<AaveOpenDependencies, AaveV2OpenDependencies>(dependencies)) {
    currentPosition = await dependencies.protocol.getCurrentPosition(
      {
        collateralToken: args.collateralToken,
        debtToken: args.debtToken,
        proxy: dependencies.proxy,
      },
      {
        addresses: dependencies.addresses,
        provider: dependencies.provider,
        protocolVersion: dependencies.protocol.version,
      },
    )
    protocolData = await dependencies.protocol.getProtocolData({
      flashloanTokenAddress,
      collateralTokenAddress,
      debtTokenAddress,
      addresses: dependencies.addresses,
      provider: dependencies.provider,
      protocolVersion: dependencies.protocol.version,
    })
  }
  if (AaveCommon.isV3<AaveOpenDependencies, AaveV3OpenDependencies>(dependencies)) {
    currentPosition = await dependencies.protocol.getCurrentPosition(
      {
        collateralToken: args.collateralToken,
        debtToken: args.debtToken,
        proxy: dependencies.proxy,
      },
      {
        addresses: dependencies.addresses,
        provider: dependencies.provider,
        protocolVersion: dependencies.protocol.version,
      },
    )

    protocolData = await dependencies.protocol.getProtocolData({
      flashloanTokenAddress,
      collateralTokenAddress,
      debtTokenAddress,
      addresses: dependencies.addresses,
      provider: dependencies.provider,
      protocolVersion: dependencies.protocol.version,
    })
  }

  if (!protocolData) throw new Error('No protocol data found')
  if (!currentPosition) throw new Error('No current position found')

  const {
    aaveFlashloanAssetPriceInEth,
    aaveDebtTokenPriceInEth,
    aaveCollateralTokenPriceInEth,
    reserveDataForFlashloan,
    reserveEModeCategory,
  } = protocolData

  const maxLoanToValueForFL = new BigNumber(reserveDataForFlashloan.ltv.toString()).div(FEE_BASE)

  const multiple = args.multiple

  const depositDebtAmountInWei = args.depositedByUser?.debtToken?.amountInBaseUnit || ZERO
  const depositCollateralAmountInWei =
    args.depositedByUser?.collateralToken?.amountInBaseUnit || ZERO

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

  // EG USDC/ETH divided by ETH/DAI = USDC/ETH times by DAI/ETH = USDC/DAI
  const oracleFLtoDebtToken = ethPerDebtToken.div(ethPerFlashloanAmount)

  // EG STETH/ETH divided by USDC/ETH = STETH/USDC
  const oracle = aaveCollateralTokenPriceInEth.div(aaveDebtTokenPriceInEth)

  const collectFeeFrom = SwapUtils.acceptedFeeToken({
    fromToken: args.debtToken.symbol,
    toToken: args.collateralToken.symbol,
  })

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
      tokenSymbol: flashloanTokenAddress === dependencies.addresses.DAI ? 'DAI' : 'USDC',
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

async function buildOperation(
  swapData: SwapData,
  simulatedPositionTransition: IBaseSimulatedTransition,
  collectFeeFrom: 'sourceToken' | 'targetToken',
  reserveEModeCategory: number | undefined,
  args: AaveOpenArgs & { flashloanToken: string },
  dependencies: AaveOpenDependencies,
) {
  const protocolVersion = dependencies.protocol.version
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken: args.debtToken, collateralToken: args.collateralToken },
    dependencies.addresses,
  )

  const depositCollateralAmountInWei =
    args.depositedByUser?.collateralToken?.amountInBaseUnit || ZERO
  const depositDebtAmountInWei = args.depositedByUser?.debtToken?.amountInBaseUnit || ZERO
  const swapAmountBeforeFees = simulatedPositionTransition.swap.fromTokenAmount
  const borrowAmountInWei = simulatedPositionTransition.delta.debt.minus(depositDebtAmountInWei)

  const isIncreasingRisk = true
  const fee = SwapUtils.feeResolver(args.collateralToken.symbol, args.debtToken.symbol, {
    isIncreasingRisk,
    isEarnPosition: args.positionType === 'Earn',
  })

  if (protocolVersion === AaveVersion.v3) {
    const flashloanProvider = resolveFlashloanProvider(
      await getForkedNetwork(dependencies.provider),
    )
    const hasCollateralDeposit = args.depositedByUser?.collateralToken?.amountInBaseUnit?.gt(ZERO)
    const depositAddress = hasCollateralDeposit ? collateralTokenAddress : debtTokenAddress
    const depositAmount = hasCollateralDeposit
      ? args.depositedByUser?.collateralToken?.amountInBaseUnit
      : args.depositedByUser?.debtToken?.amountInBaseUnit
    const borrowAmount = simulatedPositionTransition.delta.debt.minus(depositDebtAmountInWei)

    const openArgs: OpenOperationArgs = {
      collateral: {
        address: collateralTokenAddress,
        isEth: args.collateralToken.symbol === 'ETH',
      },
      debt: {
        address: debtTokenAddress,
        isEth: args.debtToken.symbol === 'ETH',
        borrow: {
          amount: borrowAmount,
        },
      },
      deposit: {
        address: depositAddress,
        amount: depositAmount || ZERO,
      },
      swap: {
        fee: fee.toNumber(),
        data: swapData.exchangeCalldata,
        amount: swapAmountBeforeFees,
        collectFeeFrom,
        receiveAtLeast: swapData.minToTokenAmount,
      },
      flashloan: {
        token: {
          amount:
            args.flashloanToken === dependencies.addresses.DAI
              ? simulatedPositionTransition.delta.flashloanAmount.abs()
              : simulatedPositionTransition.delta.flashloanAmount.abs().div(10 ** 12),
          address: args.flashloanToken,
        },
        amount: simulatedPositionTransition.delta.flashloanAmount.abs(),
        provider: flashloanProvider,
      },
      position: {
        type: args.positionType,
      },
      emode: {
        categoryId: reserveEModeCategory || 0,
      },
      proxy: {
        address: dependencies.proxy,
        isDPMProxy: dependencies.isDPMProxy,
        owner: dependencies.user,
      },
      addresses: dependencies.addresses as AAVEV3StrategyAddresses,
      network: dependencies.network,
    }

    return await operations.aave.v3.open(openArgs)
  }
  if (protocolVersion === AaveVersion.v2) {
    const openArgs = {
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
        fee: args.positionType === 'Earn' ? NO_FEE : DEFAULT_FEE,
        swapData: swapData.exchangeCalldata,
        swapAmountInBaseUnit: swapAmountBeforeFees,
        collectFeeFrom,
        receiveAtLeast: swapData.minToTokenAmount,
      },
      positionType: args.positionType,
      addresses: dependencies.addresses as AAVEStrategyAddresses,
      flashloanAmount: simulatedPositionTransition.delta.flashloanAmount,
      borrowAmountInBaseUnit: borrowAmountInWei,
      collateralTokenAddress,
      debtTokenAddress,
      useFlashloan: simulatedPositionTransition.flags.requiresFlashloan,
      proxy: dependencies.proxy,
      user: dependencies.user,
      isDPMProxy: dependencies.isDPMProxy,
      network: dependencies.network,
    }
    return await operations.aave.v2.open(openArgs)
  }
}

type GenerateTransitionArgs = {
  swapData: SwapData
  operation: IOperation
  collectFeeFrom: 'sourceToken' | 'targetToken'
  fee: BigNumber
  simulatedPositionTransition: IBaseSimulatedTransition
  args: AaveOpenArgs
  dependencies: AaveOpenDependencies
  quoteSwapData: SwapData
}

async function generateTransition({
  swapData,
  operation,
  collectFeeFrom,
  fee,
  simulatedPositionTransition,
  args,
}: GenerateTransitionArgs) {
  const fromTokenAmountNormalised = amountFromWei(
    swapData.fromTokenAmount,
    args.debtToken.precision,
  )
  const toTokenAmountNormalisedWithMaxSlippage = amountFromWei(
    swapData.minToTokenAmount,
    args.collateralToken.precision,
  )
  const expectedMarketPriceWithSlippage = fromTokenAmountNormalised.div(
    toTokenAmountNormalisedWithMaxSlippage,
  )

  const finalPosition = simulatedPositionTransition.position

  // When collecting fees from the target token (collateral here), we want to calculate the fee
  // Based on the toTokenAmount NOT minToTokenAmount so that we over estimate the fee where possible
  // And do not mislead the user
  const shouldCollectFeeFromSourceToken = collectFeeFrom === 'sourceToken'

  const preSwapFee = shouldCollectFeeFromSourceToken
    ? calculateFee(simulatedPositionTransition.delta.debt, fee.toNumber())
    : ZERO
  const postSwapFee = shouldCollectFeeFromSourceToken
    ? ZERO
    : calculateFee(swapData.toTokenAmount, fee.toNumber())

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
        collectFeeFrom,
        tokenFee: preSwapFee.plus(
          postSwapFee.times(ONE.plus(FEE_ESTIMATE_INFLATOR)).integerValue(BigNumber.ROUND_DOWN),
        ),
      },
      position: finalPosition,
      minConfigurableRiskRatio: finalPosition.minConfigurableRiskRatio(
        expectedMarketPriceWithSlippage,
      ),
    },
  }
}
