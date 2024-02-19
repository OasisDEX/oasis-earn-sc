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
  const flashloanArgs =
    args.flashloan ??
    getFlashloanToken({
      ...dependencies,
      protocol: dependencies.protocolType,
      debt: {
        symbol: args.debtToken.symbol,
        address: debtTokenAddress,
        precision: args.debtToken.precision ?? TYPICAL_PRECISION,
      },
    }).flashloan

  const protocolData = await resolveProtocolData(
    {
      collateralTokenAddress,
      debtTokenAddress,
      flashloanTokenAddress: flashloanArgs.token.address,
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
    flashloan: {
      token: flashloanArgs.token,
    },
  }

  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(expandedArgs, dependencies)

  const { operation, flashloan } = await buildOperation(
    { ...swapData, collectFeeFrom, preSwapFee },
    expandedArgs,
    dependencies,
  )

  return generate(
    swapData,
    collectFeeFrom,
    preSwapFee,
    operation,
    expandedArgs,
    flashloan,
    dependencies,
  )
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
    // Needs to be WETH for isETH comparison
    ETHAddress: addresses.tokens.WETH,
    getSwapData: dependencies.getSwapData,
  })
}

async function getAaveSwapDataToCloseToDebt(
  args: AaveLikeExpandedCloseArgs,
  dependencies: AaveLikeCloseDependencies,
) {
  const { debtToken, collateralToken, slippage } = args
  const { addresses } = dependencies
  const { collateralTokenAddress, debtTokenAddress } = getAaveTokenAddresses(
    { debtToken, collateralToken },
    addresses,
  )

  const swapAmountBeforeFees = dependencies.currentPosition.collateral.amount.minus(1)
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
