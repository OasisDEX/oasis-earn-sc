import BigNumber from 'bignumber.js'

import { IPosition } from '../../helpers/calculations/Position'
import { ZERO } from '../../helpers/constants'
import * as operations from '../../operations'
import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { BorrowArgs } from '../../operations/aave/borrow'
import { DepositArgs } from '../../operations/aave/deposit'
import { TOKEN_DEFINITIONS } from '../../operations/aave/tokens'
import { Address, IPositionTransitionDependencies } from '../types/IPositionRepository'
import { IPositionTransition } from '../types/IPositionTransition'
import { SwapData } from '../types/SwapData'

export async function depositBorrow(
  {
    entryToken,
    entryTokenAmount,
    slippage,
    borrowAmount,
  }: {
    entryToken?: Address
    entryTokenAmount?: BigNumber
    slippage?: BigNumber
    borrowAmount?: BigNumber
  },
  dependencies: IPositionTransitionDependencies<AAVEStrategyAddresses>,
): Promise<IPositionTransition> {
  const FEE = 20

  const tokenAddresses = {
    WETH: dependencies.addresses.WETH,
    ETH: dependencies.addresses.WETH,
    stETH: dependencies.addresses.stETH,
    USDC: dependencies.addresses.USDC,
    wBTC: dependencies.addresses.wBTC,
    DAI: dependencies.addresses.DAI,
  }

  const collateralTokenAddress = tokenAddresses[dependencies.currentPosition.collateral.symbol]
  const debtTokenAddress = tokenAddresses[dependencies.currentPosition.debt.symbol]

  if (!collateralTokenAddress) {
    throw new Error('Collateral token not recognized or address missing in dependencies')
  }
  if (!debtTokenAddress) {
    throw new Error('Debt token not recognized or address missing in dependencies')
  }

  let depositArgs: DepositArgs | undefined
  let borrowArgs: BorrowArgs | undefined
  let swapData: SwapData | undefined
  let collateralDelta: BigNumber = ZERO
  let debtDelta: BigNumber = ZERO

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

    depositArgs = {
      depositorAddress: dependencies.user,
      depositToken: collateralTokenAddress,
      entryToken: entryToken,
      amount: entryTokenAmount,
      allowDepositTokenAsCollateral: true,
      swapArgs: swapData
        ? {
            calldata: swapData.exchangeCalldata.toString(),
            collectFeeInFromToken: true,
            fee: FEE,
            receiveAtLeast: swapData.minToTokenAmount,
          }
        : undefined,
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
          dependencies.currentPosition.riskRatio.loanToValue
        ),
        requiresFlashloan: false,
      },
      swap: swapData
        ? {
            ...swapData,
            tokenFee: ZERO,
            collectFeeFrom: 'sourceToken',
            sourceToken: TOKEN_DEFINITIONS.DAI,
            targetToken: TOKEN_DEFINITIONS.DAI,
          }
        : undefined,
      position: finalPosition,
    },
  }
}
