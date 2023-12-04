import { operations } from '@dma-library/operations'
import { views } from '@dma-library/views'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

// import {
//   validateBorrowUndercollateralized,
//   validateDustLimit,
//   validateLiquidity,
// } from '../../validation'
import { AjnaStrategy, MorphoBluePosition } from '@dma-library/types'
import { Address } from '@dma-common/types'
import { Network } from '@deploy-configurations/types/network'
import { MorphoBlueStrategyAddresses } from '@dma-library/operations/morphoblue/addresses'
import { GetMorphoCumulativesData } from '@dma-library/views/morpho'
import { encodeOperation } from '@dma-library/utils/operation'
import { amountToWei } from '@dma-common/utils/common'
import { TEN } from '../../../../../dma-common/constants/numbers'

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
) => Promise<AjnaStrategy<MorphoBluePosition>>

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
    position.marketPatams.collateralToken.toLowerCase() === dependencies.addresses.tokens.WETH.toLowerCase()

  const operation = await operations.morphoblue.borrow.paybackWithdraw(
    {
      amountDebtToPaybackInBaseUnit: amountToWei(args.quoteAmount, args.quotePrecision),
      proxy: args.proxyAddress,
      amountCollateralToWithdrawInBaseUnit: amountToWei(args.collateralAmount, args.collateralPrecision),
      user: args.user,
      morphoBlueMarket: {
        loanToken: position.marketPatams.loanToken,
        collateralToken: position.marketPatams.collateralToken,
        oracle: position.marketPatams.oracle,
        irm: position.marketPatams.irm,
        lltv: position.marketPatams.lltv.times(TEN.pow(18)),
      }
    },
    dependencies.addresses, 
    dependencies.network
    )


  const targetPosition = position.payback(args.quoteAmount).withdraw(args.collateralAmount)

  const errors = [
    // ...validateDustLimit(targetPosition),
    // ...validateLiquidity(targetPosition, position, args.quoteAmount),
    // ...validateBorrowUndercollateralized(targetPosition, position, args.quoteAmount),
  ]

  return {
    simulation: {
      swaps: [],
      errors,
      warnings: [],
      notices: [],
      successes: [],
      targetPosition,
      position: targetPosition,
    },
    tx: {
      to: dependencies.operationExecutor,
      data: encodeOperation(operation, dependencies),
      value: isPaybackingEth ? amountToWei(args.collateralAmount, 18).toString() : '0',
    },
  }
}
