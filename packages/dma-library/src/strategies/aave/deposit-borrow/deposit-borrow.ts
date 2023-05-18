import { Address } from '@deploy-configurations/types/address'
import { TYPICAL_PRECISION, ZERO } from '@dma-common/constants'
import { operations } from '@dma-library/operations'
import { BorrowArgs, DepositArgs } from '@dma-library/operations/aave/common'
import { isAaveV2Addresses, isAaveV3Addresses } from '@dma-library/protocols/aave/config'
import { AaveVersion } from '@dma-library/strategies'
import {
  getAaveTokenAddress,
  getAaveTokenAddresses,
} from '@dma-library/strategies/aave/get-aave-token-addresses'
import {
  AAVETokens,
  IOperation,
  SwapData,
  WithBorrowDebt,
  WithDepositCollateral,
} from '@dma-library/types'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import { IStrategy, WithOptionalSwapSimulation } from '@dma-library/types/position-transition'
import {
  WithAaveEntryToken,
  WithAaveTransitionArgs,
  WithAaveV2StrategyDependencies,
  WithAaveV3StrategyDependencies,
  WithOptionalSwap,
} from '@dma-library/types/strategy-params'
import { feeResolver, getSwapDataHelper } from '@dma-library/utils/swap'
import { acceptedFeeToken } from '@dma-library/utils/swap/accepted-fee-token'
import { calculateSwapFeeAmount } from '@dma-library/utils/swap/calculate-swap-fee-amount'
import { IPosition } from '@domain'
import BigNumber from 'bignumber.js'

export type AaveDepositBorrowArgs = WithAaveTransitionArgs &
  WithAaveEntryToken &
  WithDepositCollateral &
  WithBorrowDebt

function getIsSwapNeeded(
  entryTokenAddress: Address,
  depositTokenAddress: Address,
  ETHAddress: Address,
  WETHAddress: Address,
) {
  const sameTokens = depositTokenAddress.toLowerCase() === entryTokenAddress.toLowerCase()
  const ethToWeth =
    entryTokenAddress.toLowerCase() === ETHAddress.toLowerCase() &&
    depositTokenAddress.toLowerCase() === WETHAddress.toLowerCase()

  return !(sameTokens || ethToWeth)
}

export type AaveV2DepositBorrowDependencies = WithAaveV2StrategyDependencies &
  WithV2Protocol &
  WithOptionalSwap
export type AaveV3DepositBorrowDependencies = WithAaveV3StrategyDependencies &
  WithV3Protocol &
  WithOptionalSwap
type AaveDepositBorrowDependencies =
  | AaveV2DepositBorrowDependencies
  | AaveV3DepositBorrowDependencies

type IDepositBorrowStrategy = IStrategy & {
  simulation: IStrategy['simulation'] & WithOptionalSwapSimulation
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

  const transaction = {
    calls: operation.calls,
    operationName: operation.operationName,
  }
  const simulation = {
    delta: {
      debt: borrow.debtDelta,
      collateral: deposit.collateralDelta,
    },
    position: finalPosition,
  }

  if (isSwapNeeded) {
    if (!deposit.swap) {
      throw new Error('Swap data is missing')
    }

    return {
      transaction: {
        calls: operation.calls,
        operationName: operation.operationName,
      },
      simulation: {
        ...simulation,
        swap: {
          ...deposit.swap.data,
          tokenFee: deposit.swap.fee,
          collectFeeFrom,
          sourceToken: {
            symbol: entryToken?.symbol || '',
            precision: TYPICAL_PRECISION,
          },
          targetToken: {
            symbol: collateralToken.symbol,
            precision: TYPICAL_PRECISION,
          },
        },
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

  if (protocolVersion === AaveVersion.v3 && isAaveV3Addresses(dependencies.addresses)) {
    return await operations.aave.v3.depositBorrow(depositArgs, borrowArgs, dependencies.addresses)
  }
  if (protocolVersion === AaveVersion.v2 && isAaveV2Addresses(dependencies.addresses)) {
    return await operations.aave.v2.depositBorrow(depositArgs, borrowArgs, dependencies.addresses)
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
  const collectFeeFrom = acceptedFeeToken({
    fromToken: entryToken.symbol,
    toToken: collateralSymbol,
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

    const fee = feeResolver(entryToken.symbol, collateralSymbol, {
      isEntrySwap: true,
    })
    const { swapData } = await getSwapDataHelper<typeof dependencies.addresses, AAVETokens>({
      fromTokenIsDebt: true,
      args: {
        debtToken: entryToken,
        collateralToken: collateralToken,
        slippage,
        fee,
        swapAmountBeforeFees: entryTokenAmount,
      },
      addresses: dependencies.addresses,
      services: {
        getSwapData: dependencies.getSwapData,
        getTokenAddresses: getAaveTokenAddresses,
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
    const swapFee = calculateSwapFeeAmount(
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
