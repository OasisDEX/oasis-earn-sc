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

export interface MorphoblueOpenBorrowPayload {
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

export type MorphoOpenBorrowStrategy = (
  args: MorphoblueOpenBorrowPayload,
  dependencies: MorphoBlueCommonDependencies,
) => Promise<AjnaStrategy<MorphoBluePosition>>

export const open: MorphoOpenBorrowStrategy = async (args, dependencies) => {
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

  if (position.collateralAmount.gt(0)) {
    throw new Error('Position already exists')
  }

  const isDepositingEth =
    position.marketPatams.collateralToken.toLowerCase() === dependencies.addresses.tokens.WETH.toLowerCase()
  const isBorrowingEth = position.marketPatams.loanToken.toLowerCase() === dependencies.addresses.tokens.WETH.toLowerCase()

  const operation = await operations.morphoblue.borrow.openDepositBorrow(
    {
      userFundsTokenAddress: isDepositingEth ? dependencies.addresses.tokens.ETH : position.marketPatams.collateralToken,
      userFundsTokenAmount: amountToWei(args.collateralAmount, args.collateralPrecision),
      depositorAddress: args.user,
      morphoBlueMarket: {
        loanToken: position.marketPatams.loanToken,
        collateralToken: position.marketPatams.collateralToken,
        oracle: position.marketPatams.oracle,
        irm: position.marketPatams.irm,
        lltv: position.marketPatams.lltv.times(TEN.pow(18)),
      }
    },
    {
      morphoBlueMarket: {
        loanToken: position.marketPatams.loanToken,
        collateralToken: position.marketPatams.collateralToken,
        oracle: position.marketPatams.oracle,
        irm: position.marketPatams.irm,
        lltv: position.marketPatams.lltv.times(TEN.pow(18)),
      },
      amountToBorrow: amountToWei(args.quoteAmount, args.quotePrecision),
      isEthToken: isBorrowingEth,
    },
    {
      protocol: 'MorphoBlue',
      positionType: 'Borrow',
    }, 
    dependencies.addresses, 
    dependencies.network
    )




  const targetPosition = position.deposit(args.collateralAmount).borrow(args.quoteAmount)

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
      value: isDepositingEth ? amountToWei(args.collateralAmount, 18).toString() : '0',
    },
  }
}
