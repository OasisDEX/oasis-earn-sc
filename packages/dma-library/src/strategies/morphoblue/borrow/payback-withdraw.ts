import { Network } from '@deploy-configurations/types/network'
import { Address } from '@dma-common/types'
import { amountToWei } from '@dma-common/utils/common'
import { operations } from '@dma-library/operations'
import { MorphoBlueStrategyAddresses } from '@dma-library/operations/morphoblue/addresses'
import { validateWithdrawCloseToMaxLtv } from '@dma-library/strategies/validation/closeToMaxLtv'
import { SummerStrategy, MorphoBluePosition } from '@dma-library/types'
import { encodeOperation } from '@dma-library/utils/operation'
import { views } from '@dma-library/views'
import { GetMorphoCumulativesData } from '@dma-library/views/morpho'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import { TEN, ZERO } from '../../../../../dma-common/constants/numbers'
import { validateBorrowUndercollateralized } from '../validation/validateBorrowUndercollateralized'

export interface MorphobluePaybackWithdrawPayload {
  quoteAmount: BigNumber
  collateralAmount: BigNumber
  collateralPrecision: number
  collateralPrice: BigNumber
  quotePrice: BigNumber
  quotePrecision: number
  morphoBlueMarket: string
  proxyAddress: Address
  user: Address
}

export interface MorphoBlueCommonDependencies {
  provider: ethers.providers.Provider
  getCumulatives: GetMorphoCumulativesData
  network: Network
  addresses: MorphoBlueStrategyAddresses
  operationExecutor: Address
}

export type MorphoPaybackWithdrawStrategy = (
  args: MorphobluePaybackWithdrawPayload,
  dependencies: MorphoBlueCommonDependencies,
) => Promise<SummerStrategy<MorphoBluePosition>>

export const paybackWithdraw: MorphoPaybackWithdrawStrategy = async (args, dependencies) => {
  const getPosition = views.morpho.getPosition
  const position = await getPosition(
    {
      collateralPriceUSD: args.collateralPrice,
      quotePriceUSD: args.quotePrice,
      proxyAddress: args.proxyAddress,
      collateralPrecision: args.collateralPrecision,
      quotePrecision: args.quotePrecision,
      marketId: args.morphoBlueMarket,
    },
    {
      provider: dependencies.provider,
      getCumulatives: dependencies.getCumulatives,
      morphoAddress: dependencies.addresses.morphoblue,
    },
  )

  const isPaybackingEth =
    position.marketParams.loanToken.toLowerCase() ===
    dependencies.addresses.tokens.WETH.toLowerCase()

  const operation = await operations.morphoblue.borrow.paybackWithdraw(
    {
      amountDebtToPaybackInBaseUnit: amountToWei(args.quoteAmount, args.quotePrecision),
      proxy: args.proxyAddress,
      amountCollateralToWithdrawInBaseUnit: amountToWei(
        args.collateralAmount,
        args.collateralPrecision,
      ),
      user: args.user,
      morphoBlueMarket: {
        loanToken: position.marketParams.loanToken,
        collateralToken: position.marketParams.collateralToken,
        oracle: position.marketParams.oracle,
        irm: position.marketParams.irm,
        lltv: position.marketParams.lltv.times(TEN.pow(18)),
      },
    },
    dependencies.addresses,
    dependencies.network,
  )

  const targetPosition = position.payback(args.quoteAmount).withdraw(args.collateralAmount)

  const warnings = [...validateWithdrawCloseToMaxLtv(targetPosition, position)]

  const errors = [...validateBorrowUndercollateralized(targetPosition, position, ZERO)]

  return {
    simulation: {
      swaps: [],
      errors,
      warnings,
      notices: [],
      successes: [],
      targetPosition,
      position: targetPosition,
    },
    tx: {
      to: dependencies.operationExecutor,
      data: encodeOperation(operation, dependencies),
      value: isPaybackingEth ? amountToWei(args.quoteAmount, 18).toString() : '0',
    },
  }
}
