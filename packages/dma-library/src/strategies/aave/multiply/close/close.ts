import { TYPICAL_PRECISION } from '@dma-common/constants'
import {
  getAaveTokenAddress,
  getAaveTokenAddresses,
  getFlashloanToken,
} from '@dma-library/strategies/aave/common'
import * as StrategiesCommon from '@dma-library/strategies/common'
import { PositionTransition } from '@dma-library/types'

import { buildOperation } from './build-operation'
import { generateTransition } from './generate-transition'
import { getValuesFromProtocol } from './get-values-from-protocol'
import { AaveCloseArgsWithVersioning, AaveCloseDependencies, ExpandedAaveCloseArgs } from './types'

export async function close(
  args: AaveCloseArgsWithVersioning,
  dependencies: AaveCloseDependencies,
): Promise<PositionTransition> {
  const getSwapData = args.shouldCloseToCollateral
    ? getAaveSwapDataToCloseToCollateral
    : getAaveSwapDataToCloseToDebt

  const collateralTokenAddress = getAaveTokenAddress(args.collateralToken, dependencies.addresses)
  const debtTokenAddress = getAaveTokenAddress(args.debtToken, dependencies.addresses)

  const flashloanToken = getFlashloanToken(dependencies)

  const aaveValuesFromProtocol = await getValuesFromProtocol(
    args.protocolVersion,
    collateralTokenAddress,
    debtTokenAddress,
    flashloanToken.flashloanToken.address,
    dependencies,
  )

  const expandedArgs: ExpandedAaveCloseArgs = {
    ...args,
    ...flashloanToken,
    collateralTokenAddress,
    debtTokenAddress,
    protocolValues: aaveValuesFromProtocol,
  }

  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(expandedArgs, dependencies)

  const operation = await buildOperation(
    { ...swapData, collectFeeFrom, preSwapFee },
    expandedArgs,
    dependencies,
  )

  return generateTransition(
    swapData,
    collectFeeFrom,
    preSwapFee,
    operation,
    expandedArgs,
    dependencies,
  )
}

async function getAaveSwapDataToCloseToCollateral(
  {
    debtToken,
    collateralToken,
    slippage,
    protocolValues: { collateralTokenPrice, debtTokenPrice },
  }: ExpandedAaveCloseArgs,
  dependencies: AaveCloseDependencies,
) {
  const { addresses } = dependencies
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken, collateralToken },
    addresses,
  )

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
    colPrice: collateralTokenPrice,
    debtPrice: debtTokenPrice,
    outstandingDebt: dependencies.currentPosition.debt.amount,
    slippage,
    ETHAddress: addresses.ETH,
    getSwapData: dependencies.getSwapData,
  })
}

async function getAaveSwapDataToCloseToDebt(
  { debtToken, collateralToken, slippage }: ExpandedAaveCloseArgs,
  dependencies: AaveCloseDependencies,
) {
  const { addresses } = dependencies
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken, collateralToken },
    addresses,
  )

  const swapAmountBeforeFees = dependencies.currentPosition.collateral.amount
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
    swapAmountBeforeFees,
    getSwapData: dependencies.getSwapData,
  })
}
