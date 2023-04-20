import * as operations from '@dma-library/operations'
import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2/addresses'
import { BorrowArgs } from '@dma-library/operations/aave/v2/borrow'
import { DepositArgs } from '@dma-library/operations/aave/v2/deposit'
import { IPositionTransitionDependencies, PositionTransition, SwapData } from '@dma-library/types'
import { AAVETokens } from '@dma-library/types/aave'
import { acceptedFeeToken } from '@dma-library/utils/swap/accepted-fee-token'
import { getZeroSwap } from '@dma-library/utils/swap/get-zero-swap'
import { TYPICAL_PRECISION, ZERO } from '@oasisdex/dma-common/constants'
import { Address } from '@oasisdex/dma-deployments/types/address'
import { IPosition, RiskRatio } from '@oasisdex/domain'
import BigNumber from 'bignumber.js'

interface DepositBorrowArgs {
  entryToken?: {
    amountInBaseUnit: BigNumber
    symbol: Exclude<AAVETokens, 'WSTETH'>
    precision?: number
  }
  slippage?: BigNumber
  borrowAmount?: BigNumber
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
  { entryToken, slippage, borrowAmount }: DepositBorrowArgs,
  dependencies: IPositionTransitionDependencies<AAVEStrategyAddresses>,
): Promise<PositionTransition> {
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
  let collectFeeFrom: 'sourceToken' | 'targetToken' = 'sourceToken'

  if (entryToken && entryTokenAmount && slippage && entryTokenAmount.gt(ZERO)) {
    const isSwapNeeded = getIsSwapNeeded(
      entryTokenAddress,
      collateralTokenAddress,
      tokenAddresses.ETH,
      tokenAddresses.WETH,
    )
    collectFeeFrom = acceptedFeeToken({
      fromToken: entryToken.symbol,
      toToken: collateralSymbol,
    })

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

  const operation = await operations.aave.v2.depositBorrow(depositArgs, borrowArgs)

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
