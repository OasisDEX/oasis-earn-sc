import BigNumber from 'bignumber.js'

import { IPosition } from '../../helpers/calculations/Position'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { TYPICAL_PRECISION, ZERO } from '../../helpers/constants'
import { getZeroSwap } from '../../helpers/swap/getZeroSwap'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { BorrowArgs } from '../../operations/aave/borrow'
import { DepositArgs } from '../../operations/aave/deposit'
import { Address, IPositionTransition, IPositionTransitionDependencies, SwapData } from '../types'
import { AAVETokens } from '../types/aave'

interface DepositBorrowArgs {
  entryToken?: { amountInBaseUnit: BigNumber; symbol: AAVETokens; precision?: number }
  slippage?: BigNumber
  borrowAmount?: BigNumber
  collectFeeFrom: 'sourceToken' | 'targetToken'
}

function checkTokenSupport<S extends string>(
  token: string,
  supportedTokens: Record<S, string>,
  message: string,
): asserts token is keyof typeof supportedTokens {
  if (!Object.keys(supportedTokens).some(key => key === token)) {
    throw new Error(message)
  }
}

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

export async function depositBorrow(
  { entryToken, slippage, borrowAmount, collectFeeFrom }: DepositBorrowArgs,
  dependencies: IPositionTransitionDependencies<AAVEStrategyAddresses>,
): Promise<IPositionTransition> {
  const FEE = 20
  const FEE_BASE = 10000

  const tokenAddresses = {
    WETH: dependencies.addresses.WETH,
    ETH: dependencies.addresses.ETH,
    STETH: dependencies.addresses.STETH,
    USDC: dependencies.addresses.USDC,
    WBTC: dependencies.addresses.WBTC,
    DAI: dependencies.addresses.DAI,
  }

  const entryTokenAmount = entryToken?.amountInBaseUnit || ZERO
  const entryTokenAddress: string = (entryToken?.symbol && tokenAddresses[entryToken?.symbol]) || ''
  const entryTokenIsEth = entryToken?.symbol === 'ETH'

  const collateralSymbol = dependencies.currentPosition.collateral.symbol
  const debtSymbol = dependencies.currentPosition.debt.symbol

  checkTokenSupport(collateralSymbol, tokenAddresses, 'Collateral token not supported')
  checkTokenSupport(debtSymbol, tokenAddresses, 'Debt token not supported')

  const collateralTokenAddress = tokenAddresses[collateralSymbol]
  const debtTokenAddress = tokenAddresses[debtSymbol]

  let depositArgs: DepositArgs | undefined
  let borrowArgs: BorrowArgs | undefined
  let swapData: SwapData = getZeroSwap(entryToken ? entryToken.symbol : '', collateralSymbol)
  let collateralDelta: BigNumber = ZERO
  let debtDelta: BigNumber = ZERO
  let fee: BigNumber = ZERO

  if (entryToken && entryTokenAmount && slippage && entryTokenAmount.gt(ZERO)) {
    const isSwapNeeded = getIsSwapNeeded(
      entryTokenAddress,
      collateralTokenAddress,
      tokenAddresses.ETH,
      tokenAddresses.WETH,
    )
    swapData = isSwapNeeded
      ? await dependencies.getSwapData(
          entryTokenAddress,
          collateralTokenAddress,
          entryTokenAmount,
          slippage,
        )
      : getZeroSwap(entryToken.symbol, collateralSymbol)
    const collectFeeInFromToken = collectFeeFrom === 'sourceToken'
    depositArgs = {
      depositorAddress: dependencies.user,
      depositToken:
        collateralTokenAddress.toLowerCase() === tokenAddresses.ETH.toLowerCase()
          ? tokenAddresses.WETH
          : collateralTokenAddress,
      entryTokenAddress: entryTokenAddress,
      entryTokenIsEth,
      amountInBaseUnit: entryTokenAmount,
      isSwapNeeded,
      swapArgs: swapData
        ? {
            calldata: swapData.exchangeCalldata.toString(),
            collectFeeInFromToken,
            fee: FEE,
            receiveAtLeast: swapData.minToTokenAmount,
          }
        : undefined,
    }

    if (collectFeeInFromToken) {
      fee = swapData?.fromTokenAmount.times(FEE).div(FEE_BASE) || ZERO
    } else {
      fee = swapData?.toTokenAmount.times(FEE).div(FEE_BASE) || ZERO
    }

    // should we show toTokenAmount or minTokenAmount
    collateralDelta = swapData.toTokenAmount.eq(ZERO) ? entryTokenAmount : swapData.toTokenAmount
  }

  if (borrowAmount?.gt(ZERO)) {
    borrowArgs = {
      account: dependencies.proxy,
      amountInBaseUnit: borrowAmount,
      borrowToken:
        debtTokenAddress === dependencies.addresses.ETH
          ? dependencies.addresses.WETH
          : debtTokenAddress,
      user: dependencies.user,
      isEthToken: debtTokenAddress === dependencies.addresses.ETH,
    }
    debtDelta = borrowAmount
  }

  const operation = await operations.aave.depositBorrow(depositArgs, borrowArgs)

  /*
    Final position calculated using actual swap data and the latest market price
   */
  const finalPosition: IPosition = dependencies.currentPosition
    .deposit(collateralDelta)
    .borrow(debtDelta)

  return {
    transaction: {
      calls: operation.calls,
      operationName: operation.operationName,
    },
    simulation: {
      delta: {
        debt: debtDelta,
        collateral: collateralDelta,
        flashloanAmount: ZERO,
      },
      flags: {
        isIncreasingRisk: finalPosition.riskRatio.loanToValue.gt(
          dependencies.currentPosition.riskRatio.loanToValue,
        ),
        requiresFlashloan: false,
      },
      swap: {
        ...swapData,
        tokenFee: fee,
        collectFeeFrom,
        sourceToken: {
          symbol: entryToken?.symbol || '',
          precision: TYPICAL_PRECISION,
        },
        targetToken: {
          symbol: collateralSymbol,
          precision: TYPICAL_PRECISION,
        },
      },
      position: finalPosition,
      minConfigurableRiskRatio: new RiskRatio(ZERO, RiskRatio.TYPE.MULITPLE), // REMOVE IT
    },
  }
}
