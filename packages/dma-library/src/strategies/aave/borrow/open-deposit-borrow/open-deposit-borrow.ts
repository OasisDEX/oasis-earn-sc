import { CollectFeeFrom } from '@dma-common/types'
import { BorrowArgs, DepositArgs, operations } from '@dma-library/operations'
import * as AaveCommon from '@dma-library/strategies/aave/common'
import { getAaveTokenAddress } from '@dma-library/strategies/aave/common'
import { IOperation } from '@dma-library/types'
import { AaveVersion } from '@dma-library/types/aave'
import * as SwapUtils from '@dma-library/utils/swap'
import { getCurrentPosition } from '@dma-library/views/aave'
import { IPosition } from '@domain'

import {
  AaveOpenDepositBorrow,
  AaveOpenDepositBorrowArgs,
  AaveOpenDepositBorrowDependencies,
  AaveV3OpenDepositBorrowDependencies,
} from './types'

export const openDepositBorrow: AaveOpenDepositBorrow = async (args, dependencies) => {
  const {
    collateralToken,
    debtToken,
    entryToken,
    slippage,
    amountCollateralToDepositInBaseUnit: depositAmount,
    amountDebtToBorrowInBaseUnit: borrowAmount,
  } = args

  const currentPosition = await resolveCurrentPositionForProtocol(args, dependencies)
  const entryTokenAddress = getAaveTokenAddress(entryToken, dependencies.addresses)
  const collateralTokenAddress = getAaveTokenAddress(collateralToken, dependencies.addresses)

  const isSwapNeeded = SwapUtils.getIsSwapNeeded(
    entryTokenAddress,
    collateralTokenAddress,
    dependencies.addresses.ETH,
    dependencies.addresses.WETH,
  )

  const alwaysReturnDepositArgs = true
  const deposit = await AaveCommon.buildDepositArgs(
    entryToken,
    collateralToken,
    collateralTokenAddress,
    depositAmount,
    slippage,
    dependencies,
    alwaysReturnDepositArgs,
  )

  const alwaysReturnBorrowArgs = true
  const borrow = await AaveCommon.buildBorrowArgs(
    borrowAmount,
    debtToken,
    dependencies,
    alwaysReturnBorrowArgs,
  )

  if (!deposit.args) throw new Error('Deposit args must be defined when opening position')
  if (!borrow.args) throw new Error('Borrow args must be defined when opening position')
  const operation = await buildOperation(deposit.args, borrow.args, dependencies)

  const finalPosition: IPosition = currentPosition
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
  depositArgs: DepositArgs,
  borrowArgs: BorrowArgs,
  dependencies: AaveOpenDepositBorrowDependencies,
): Promise<IOperation> {
  if (
    AaveCommon.isV3<AaveOpenDepositBorrowDependencies, AaveV3OpenDepositBorrowDependencies>(
      dependencies,
    )
  ) {
    return await operations.aave.v3.openDepositBorrow(
      depositArgs,
      borrowArgs,
      {
        positionType: dependencies.positionType,
        protocol: 'AAVE_V3',
      },
      dependencies.addresses,
      dependencies.network,
    )
  }
  if (AaveCommon.isV2(dependencies)) {
    return await operations.aave.v2.openDepositAndBorrow(
      depositArgs,
      borrowArgs,
      {
        positionType: dependencies.positionType,
        protocol: 'AAVE',
      },
      dependencies.addresses,
      dependencies.network,
    )
  }

  throw new Error('No operation found for Aave protocol version')
}

async function resolveCurrentPositionForProtocol(
  args: AaveOpenDepositBorrowArgs,
  dependencies: AaveOpenDepositBorrowDependencies,
) {
  if (
    AaveCommon.isV3<AaveOpenDepositBorrowDependencies, AaveV3OpenDepositBorrowDependencies>(
      dependencies,
    )
  ) {
    return await getCurrentPosition(
      { ...args, proxy: dependencies.proxy },
      { ...dependencies, protocolVersion: AaveVersion.v3 },
    )
  }

  if (AaveCommon.isV2(dependencies)) {
    return await getCurrentPosition(
      { ...args, proxy: dependencies.proxy },
      { ...dependencies, protocolVersion: AaveVersion.v2 },
    )
  }

  throw new Error('No current position resolver found for Aave protocol version')
}
