import { Address } from '@deploy-configurations/types/address'
import { TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { CollectFeeFrom } from '@dma-common/types'
import * as AddressesUtils from '@dma-common/utils/addresses'
import { BorrowArgs, DepositArgs, operations } from '@dma-library/operations'
import * as AaveProtocolUtils from '@dma-library/protocols/aave'
import { AaveVersion, getAaveTokenAddress } from '@dma-library/strategies'
import { AAVETokens, IOperation, SwapData } from '@dma-library/types'
import * as AaveProtocol from '@dma-library/types/aave/protocol'
import * as Strategies from '@dma-library/types/strategies'
import * as StrategyParams from '@dma-library/types/strategy-params'
import * as SwapUtils from '@dma-library/utils/swap'
import { IPosition } from '@domain'
import BigNumber from 'bignumber.js'

export type AaveDepositBorrowArgs = StrategyParams.WithAaveStrategyArgs &
  StrategyParams.WithAaveEntryToken &
  StrategyParams.WithDepositCollateral &
  StrategyParams.WithBorrowDebt

function getIsSwapNeeded(
  entryTokenAddress: Address,
  depositTokenAddress: Address,
  ETHAddress: Address,
  WETHAddress: Address,
) {
  const sameTokens = AddressesUtils.areAddressesEqual(depositTokenAddress, entryTokenAddress)
  const ethToWeth =
    AddressesUtils.areAddressesEqual(entryTokenAddress, ETHAddress) &&
    AddressesUtils.areAddressesEqual(depositTokenAddress, WETHAddress)

  return !(sameTokens || ethToWeth)
}

export type AaveV2DepositBorrowDependencies = StrategyParams.WithAaveV2StrategyDependencies &
  AaveProtocol.WithV2Protocol &
  StrategyParams.WithOptionalSwap
export type AaveV3DepositBorrowDependencies = StrategyParams.WithAaveV3StrategyDependencies &
  AaveProtocol.WithV3Protocol &
  StrategyParams.WithOptionalSwap
type AaveDepositBorrowDependencies =
  | AaveV2DepositBorrowDependencies
  | AaveV3DepositBorrowDependencies

type IDepositBorrowStrategy = Strategies.IStrategy & {
  simulation: Strategies.IStrategy['simulation'] & Strategies.WithOptionalSwapSimulation
}

export type AaveV2DepositBorrow = (
  args: AaveDepositBorrowArgs,
  dependencies: Omit<AaveV2DepositBorrowDependencies, 'protocol'>,
) => Promise<IDepositBorrowStrategy>

export type AaveV3DepositBorrow = (
  args: AaveDepositBorrowArgs,
  dependencies: Omit<AaveV3DepositBorrowDependencies, 'protocol'>,
) => Promise<IDepositBorrowStrategy>

export type AaveDepositBorrow = (
  args: AaveDepositBorrowArgs,
  dependencies: AaveDepositBorrowDependencies,
) => Promise<IDepositBorrowStrategy>

export const depositBorrow: AaveDepositBorrow = async (args, dependencies) => {
  const {
    collateralToken,
    debtToken,
    entryToken,
    slippage,
    amountCollateralToDepositInBaseUnit: depositAmount,
    amountDebtToBorrowInBaseUnit: borrowAmount,
  } = args
  const entryTokenAddress = getAaveTokenAddress(entryToken, dependencies.addresses)
  const collateralTokenAddress = getAaveTokenAddress(collateralToken, dependencies.addresses)

  const isSwapNeeded = getIsSwapNeeded(
    entryTokenAddress,
    collateralTokenAddress,
    dependencies.addresses.ETH,
    dependencies.addresses.WETH,
  )

  const deposit = await buildDepositArgs(
    entryToken,
    collateralToken,
    collateralTokenAddress,
    depositAmount,
    slippage,
    dependencies,
  )
  const borrow = await buildBorrowArgs(borrowAmount, debtToken, dependencies)

  const collectFeeFrom: 'sourceToken' | 'targetToken' = 'sourceToken'

  const operation = await buildOperation(deposit.args, borrow.args, dependencies)

  const finalPosition: IPosition = dependencies.currentPosition
    .deposit(deposit.collateralDelta)
    .borrow(borrow.debtDelta)

  const transaction = buildTransaction(operation)
  const simulation = buildSimulation(borrow.debtDelta, deposit.collateralDelta, finalPosition)

  if (isSwapNeeded) {
    if (!deposit.swap) {
      throw new Error('Swap data is missing')
    }

    return {
      transaction,
      simulation: {
        ...simulation,
        swap: buildSwap(deposit.swap, entryToken, collateralToken, collectFeeFrom),
      },
    }
  }

  return {
    transaction,
    simulation,
  }
}

async function buildOperation(
  depositArgs: DepositArgs | undefined,
  borrowArgs: BorrowArgs | undefined,
  dependencies: AaveDepositBorrowDependencies,
): Promise<IOperation> {
  const protocolVersion = dependencies.protocol.version

  if (
    protocolVersion === AaveVersion.v3 &&
    AaveProtocolUtils.isAaveV3Addresses(dependencies.addresses)
  ) {
    return await operations.aave.v3.depositBorrow(
      depositArgs,
      borrowArgs,
      dependencies.addresses,
      dependencies.network,
    )
  }
  if (
    protocolVersion === AaveVersion.v2 &&
    AaveProtocolUtils.isAaveV2Addresses(dependencies.addresses)
  ) {
    return await operations.aave.v2.depositBorrow(
      depositArgs,
      borrowArgs,
      dependencies.addresses,
      dependencies.network,
    )
  }

  throw new Error('No operation found for Aave protocol version')
}

async function buildDepositArgs(
  entryToken: { symbol: AAVETokens },
  collateralToken: { symbol: AAVETokens },
  collateralTokenAddress: Address,
  entryTokenAmount: BigNumber,
  slippage: BigNumber,
  dependencies: AaveDepositBorrowDependencies,
): Promise<{
  swap:
    | {
        data: SwapData
        fee: BigNumber
        collectFeeFrom: 'sourceToken' | 'targetToken'
      }
    | undefined
  args: DepositArgs | undefined
  collateralDelta: BigNumber
}> {
  const entryTokenIsEth = entryToken?.symbol === 'ETH'
  const entryTokenAddress = getAaveTokenAddress(entryToken, dependencies.addresses)
  const collateralSymbol = collateralToken.symbol

  const isDepositNeeded = entryToken && entryTokenAmount && slippage && entryTokenAmount.gt(ZERO)
  if (!isDepositNeeded) return { args: undefined, collateralDelta: ZERO, swap: undefined }

  const isSwapNeeded = getIsSwapNeeded(
    entryTokenAddress,
    collateralTokenAddress,
    dependencies.addresses.ETH,
    dependencies.addresses.WETH,
  )
  const collectFeeFrom = SwapUtils.acceptedFeeTokenBySymbol({
    fromTokenSymbol: entryToken.symbol,
    toTokenSymbol: collateralSymbol,
  })

  const depositArgs = {
    depositorAddress: dependencies.user,
    depositToken:
      collateralTokenAddress.toLowerCase() === dependencies.addresses.ETH.toLowerCase()
        ? dependencies.addresses.WETH
        : collateralTokenAddress,
    entryTokenAddress: entryTokenAddress,
    entryTokenIsEth,
    amountInBaseUnit: entryTokenAmount,
    isSwapNeeded,
    swapArgs: undefined,
  }
  if (isSwapNeeded) {
    if (!dependencies.getSwapData) throw new Error('Swap data is required for swap to be performed')

    const collectFeeInFromToken = collectFeeFrom === 'sourceToken'
    const fee = SwapUtils.feeResolver(entryToken.symbol, collateralSymbol, {
      isEntrySwap: true,
    })

    const { swapData } = await SwapUtils.getSwapDataHelper<
      typeof dependencies.addresses,
      AAVETokens
    >({
      args: {
        fromToken: entryToken,
        toToken: collateralToken,
        slippage,
        fee,
        swapAmountBeforeFees: entryTokenAmount,
      },
      addresses: dependencies.addresses,
      services: {
        getSwapData: dependencies.getSwapData,
        getTokenAddress: getAaveTokenAddress,
      },
    })

    const swapArgs = {
      calldata: swapData.exchangeCalldata.toString(),
      collectFeeInFromToken,
      fee: fee.toNumber(),
      receiveAtLeast: swapData.minToTokenAmount,
    }

    // If a swap is needed, the collateral delta is to token amount (amount of collateral received)
    const collateralDelta = swapData.minToTokenAmount

    // Estimated fee collected from Swap
    const swapFee = SwapUtils.calculateSwapFeeAmount(
      collectFeeFrom,
      entryTokenAmount,
      swapData.toTokenAmount,
      fee,
    )

    return {
      args: {
        ...depositArgs,
        swapArgs,
      },
      collateralDelta,
      swap: {
        data: swapData,
        fee: swapFee,
        collectFeeFrom,
      },
    }
  }
  if (!isSwapNeeded) {
    // If no swap is needed, the collateral delta is the same as the entry token amount (deposit amount)
    const collateralDelta = entryTokenAmount

    return {
      args: depositArgs,
      collateralDelta,
      swap: undefined,
    }
  }

  throw new Error('No deposit args found')
}

async function buildBorrowArgs(
  borrowAmount: BigNumber,
  debtToken: { symbol: AAVETokens },
  dependencies: AaveDepositBorrowDependencies,
): Promise<{
  args: BorrowArgs | undefined
  debtDelta: BigNumber
}> {
  if (borrowAmount.lte(ZERO)) {
    return { args: undefined, debtDelta: ZERO }
  }

  const debtTokenAddress = getAaveTokenAddress(debtToken, dependencies.addresses)

  const borrowArgs = {
    account: dependencies.proxy,
    amountInBaseUnit: borrowAmount,
    borrowToken:
      debtTokenAddress === dependencies.addresses.ETH
        ? dependencies.addresses.WETH
        : debtTokenAddress,
    user: dependencies.user,
    isEthToken: debtTokenAddress === dependencies.addresses.ETH,
  }
  const debtDelta = borrowAmount

  return { args: borrowArgs, debtDelta }
}

function buildSwap(
  swap: {
    data: SwapData
    fee: BigNumber
    collectFeeFrom: 'sourceToken' | 'targetToken'
  },
  entryToken: { symbol: AAVETokens },
  collateralToken: { symbol: AAVETokens },
  collectFeeFrom: CollectFeeFrom,
) {
  return {
    ...swap.data,
    tokenFee: swap.fee,
    collectFeeFrom,
    sourceToken: {
      symbol: entryToken?.symbol || '',
      precision: TYPICAL_PRECISION,
    },
    targetToken: {
      symbol: collateralToken.symbol,
      precision: TYPICAL_PRECISION,
    },
  }
}

function buildTransaction(operation: IOperation) {
  return {
    calls: operation.calls,
    operationName: operation.operationName,
  }
}

function buildSimulation(
  debtDelta: BigNumber,
  collateralDelta: BigNumber,
  finalPosition: IPosition,
) {
  return {
    delta: {
      debt: debtDelta,
      collateral: collateralDelta,
    },
    position: finalPosition,
  }
}
