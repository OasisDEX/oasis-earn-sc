import { TYPICAL_PRECISION } from '@dma-common/constants'
import {
  getAaveTokenAddress,
  getAaveTokenAddresses,
  getFlashloanToken,
} from '@dma-library/strategies/aave/common'
import { resolveProtocolData } from '@dma-library/strategies/aave-like/common'
import * as StrategiesCommon from '@dma-library/strategies/common'

import { buildOperation } from './build-operation'
import { generate } from './generate'
import { AaveLikeClose, AaveLikeCloseDependencies, AaveLikeExpandedCloseArgs } from './types'

export const close: AaveLikeClose = async (args, dependencies) => {
  const getSwapData = args.shouldCloseToCollateral
    ? getAaveSwapDataToCloseToCollateral
    : getAaveSwapDataToCloseToDebt

  const collateralTokenAddress = getAaveTokenAddress(args.collateralToken, dependencies.addresses)
  const debtTokenAddress = getAaveTokenAddress(args.debtToken, dependencies.addresses)
  const { flashloanToken } = getFlashloanToken(dependencies)

  const protocolData = await resolveProtocolData(
    {
      collateralTokenAddress,
      debtTokenAddress,
      flashloanTokenAddress: flashloanToken.address,
      addresses: dependencies.addresses,
      provider: dependencies.provider,
    },
    dependencies.protocolType,
  )

  const expandedArgs: AaveLikeExpandedCloseArgs = {
    ...args,
    collateralToken: { ...args.collateralToken, address: collateralTokenAddress },
    debtToken: { ...args.debtToken, address: debtTokenAddress },
    protocolData: protocolData,
    flashloanToken: { ...flashloanToken, address: flashloanToken.address },
  }

  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(expandedArgs, dependencies)

  const operation = await buildOperation(
    { ...swapData, collectFeeFrom, preSwapFee },
    expandedArgs,
    dependencies,
  )

  return generate(swapData, collectFeeFrom, preSwapFee, operation, expandedArgs, dependencies)
}

async function getAaveSwapDataToCloseToCollateral(
  args: AaveLikeExpandedCloseArgs,
  dependencies: AaveLikeCloseDependencies,
) {
  const {
    debtToken,
    collateralToken,
    protocolData: {
      collateralTokenPriceInEth: collateralTokenPrice,
      debtTokenPriceInEth: debtTokenPrice,
    },
    slippage,
  } = args
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

  if (!collateralTokenPrice || !debtTokenPrice) {
    throw new Error('Could not get collateral or debt token price')
  }

  return await StrategiesCommon.getSwapDataForCloseToCollateral({
    collateralToken: collateralTokenWithAddress,
    debtToken: debtTokenWithAddress,
    colPrice: collateralTokenPrice,
    debtPrice: debtTokenPrice,
    outstandingDebt: dependencies.currentPosition.debt.amount,
    slippage,
    ETHAddress: addresses.tokens.ETH,
    getSwapData: dependencies.getSwapData,
  })
}

async function getAaveSwapDataToCloseToDebt(
  { debtToken, collateralToken, slippage }: AaveLikeExpandedCloseArgs,
  dependencies: AaveLikeCloseDependencies,
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
