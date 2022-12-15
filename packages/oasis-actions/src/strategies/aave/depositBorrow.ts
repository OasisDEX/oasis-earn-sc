import BigNumber from 'bignumber.js'

import { IPosition } from '../../helpers/calculations/Position'
import { RiskRatio } from '../../helpers/calculations/RiskRatio'
import { TYPICAL_PRECISION, ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { BorrowArgs } from '../../operations/aave/borrow'
import { DepositArgs } from '../../operations/aave/deposit'
import { Address, IPositionTransitionDependencies } from '../types/IPositionRepository'
import { IPositionTransition } from '../types/IPositionTransition'
import { SwapData } from '../types/SwapData'

function checkTokenSupport<S extends string>(
  token: string,
  supportedTokens: Record<S, string>,
  message: string,
): asserts token is keyof typeof supportedTokens {
  if (!Object.keys(supportedTokens).some(key => key === token)) {
    throw new Error(message)
  }
}

export async function depositBorrow(
  {
    entryToken,
    entryTokenAmount,
    slippage,
    borrowAmount,
    collectFeeFrom,
  }: {
    entryToken?: Address
    entryTokenAmount?: BigNumber
    slippage?: BigNumber
    borrowAmount?: BigNumber
    collectFeeFrom: 'sourceToken' | 'targetToken'
  },
  dependencies: IPositionTransitionDependencies<AAVEStrategyAddresses>,
): Promise<IPositionTransition> {
  const FEE = 20
  const FEE_BASE = 10000

  const tokenAddresses = {
    WETH: dependencies.addresses.WETH,
    ETH: dependencies.addresses.ETH,
    stETH: dependencies.addresses.stETH,
    USDC: dependencies.addresses.USDC,
    wBTC: dependencies.addresses.wBTC,
    DAI: dependencies.addresses.DAI,
  }

  const collateralSymbol = dependencies.currentPosition.collateral.symbol
  const debtSymbol = dependencies.currentPosition.debt.symbol

  checkTokenSupport(collateralSymbol, tokenAddresses, 'Collateral token not supported')
  checkTokenSupport(debtSymbol, tokenAddresses, 'Debt token not supported')

  const collateralTokenAddress = tokenAddresses[collateralSymbol]
  const debtTokenAddress = tokenAddresses[debtSymbol]

  let depositArgs: DepositArgs | undefined
  let borrowArgs: BorrowArgs | undefined
  let swapData: SwapData | undefined
  let collateralDelta: BigNumber = ZERO
  let debtDelta: BigNumber = ZERO
  let fee: BigNumber = ZERO

  if (entryToken && entryTokenAmount && slippage) {
    swapData =
      entryToken !== collateralTokenAddress
        ? await dependencies.getSwapData(
            entryToken,
            collateralTokenAddress,
            entryTokenAmount,
            slippage,
          )
        : undefined
    const collectFeeInFromToken = collectFeeFrom === 'sourceToken'
    depositArgs = {
      depositorAddress: dependencies.user,
      depositToken: collateralTokenAddress,
      entryToken: entryToken,
      amount: entryTokenAmount,
      allowDepositTokenAsCollateral: true,
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
    collateralDelta = swapData ? swapData.toTokenAmount : entryTokenAmount
  } else {
    console.log('Skipping deposit')
  }

  if (borrowAmount) {
    borrowArgs = {
      account: dependencies.proxy,
      amount: borrowAmount,
      borrowToken: debtTokenAddress,
    }
    debtDelta = borrowAmount
  } else {
    console.log('Skipping borrow')
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
        ...swapData!,
        tokenFee: fee,
        collectFeeFrom,
        sourceToken: {
          symbol: '',
          precision: TYPICAL_PRECISION,
        },
        targetToken: {
          symbol: '',
          precision: TYPICAL_PRECISION,
        }
      },
      position: finalPosition,
      minConfigurableRiskRatio: new RiskRatio(ZERO, RiskRatio.TYPE.MULITPLE), // REMOVE IT
    },
  }
}
