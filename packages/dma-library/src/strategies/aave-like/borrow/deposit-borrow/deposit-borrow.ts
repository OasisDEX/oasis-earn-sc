import { CollectFeeFrom } from '@dma-common/types'
import { BorrowArgs, DepositArgs } from '@dma-library/operations'
import { resolveAaveLikeOperations } from '@dma-library/operations/aave-like/resolve-aavelike-operations'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { getAaveTokenAddress } from '@dma-library/strategies/aave/common'
import { IOperation, PositionType } from '@dma-library/types'
import * as SwapUtils from '@dma-library/utils/swap'
import { IPosition } from '@domain'

import { AaveLikeDepositBorrow, AaveLikeDepositBorrowDependencies } from './types'

export const depositBorrow: AaveLikeDepositBorrow = async (args, dependencies) => {
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

  const isSwapNeeded = SwapUtils.getIsSwapNeeded(
    entryTokenAddress,
    collateralTokenAddress,
    dependencies.addresses.tokens.ETH,
    dependencies.addresses.tokens.WETH,
  )

  const deposit = await AaveCommon.buildDepositArgs(
    entryToken,
    collateralToken,
    collateralTokenAddress,
    depositAmount,
    slippage,
    dependencies,
  )
  const borrow = await AaveCommon.buildBorrowArgs(borrowAmount, debtToken, dependencies)
  const operation = await buildOperation(deposit.args, borrow.args, dependencies)

  const finalPosition: IPosition = dependencies.currentPosition
    .deposit(deposit.collateralDelta)
    .borrow(borrow.debtDelta)

  const transaction = AaveCommon.buildTransaction(operation)
  const simulation = AaveCommon.buildSimulation(
    borrow.debtDelta,
    deposit.collateralDelta,
    finalPosition,
  )

  const collectFeeFrom: CollectFeeFrom = 'sourceToken'
  if (isSwapNeeded) {
    if (!deposit.swap) {
      throw new Error('Swap data is missing')
    }

    return {
      transaction,
      simulation: {
        ...simulation,
        swap: AaveCommon.buildSwap(deposit.swap, entryToken, collateralToken, collectFeeFrom),
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
  dependencies: AaveLikeDepositBorrowDependencies,
): Promise<IOperation> {
  const positionType: PositionType = 'Borrow'
  const protocolOperations = resolveAaveLikeOperations(dependencies.protocolType, positionType)

  return protocolOperations.depositBorrow(
    depositArgs,
    borrowArgs,
    dependencies.addresses,
    dependencies.network,
  )
}
