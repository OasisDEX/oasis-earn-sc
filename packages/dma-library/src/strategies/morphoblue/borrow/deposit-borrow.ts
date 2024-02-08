import { Network } from '@deploy-configurations/types/network'
import { Address } from '@dma-common/types'
import { amountToWei } from '@dma-common/utils/common'
import { operations } from '@dma-library/operations'
import { MorphoBlueStrategyAddresses } from '@dma-library/operations/morphoblue/addresses'
import { validateGenerateCloseToMaxLtv } from '@dma-library/strategies/validation/closeToMaxLtv'
import { MorphoBluePosition, SummerStrategy } from '@dma-library/types'
import { encodeOperation } from '@dma-library/utils/operation'
import { GetCumulativesData, views } from '@dma-library/views'
import { MorphoCumulativesData } from '@dma-library/views/morpho'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import { TEN } from '../../../../../dma-common/constants/numbers'
import { validateBorrowUndercollateralized } from '../validation/validateBorrowUndercollateralized'
import { validateLiquidity } from '../validation/validateLiquidity'

export interface MorphoblueDepositBorrowPayload {
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
  getCumulatives: GetCumulativesData<MorphoCumulativesData>
  network: Network
  addresses: MorphoBlueStrategyAddresses
  operationExecutor: Address
}

export type MorphoDepositBorrowStrategy = (
  args: MorphoblueDepositBorrowPayload,
  dependencies: MorphoBlueCommonDependencies,
) => Promise<SummerStrategy<MorphoBluePosition>>

export const depositBorrow: MorphoDepositBorrowStrategy = async (args, dependencies) => {
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

  const isDepositingEth =
    position.marketParams.collateralToken.toLowerCase() ===
    dependencies.addresses.tokens.WETH.toLowerCase()
  const isBorrowingEth =
    position.marketParams.loanToken.toLowerCase() ===
    dependencies.addresses.tokens.WETH.toLowerCase()

  const operation = await operations.morphoblue.borrow.depositBorrow(
    args.collateralAmount.gt(0)
      ? {
          userFundsTokenAddress: isDepositingEth
            ? dependencies.addresses.tokens.ETH
            : position.marketParams.collateralToken,
          userFundsTokenAmount: amountToWei(args.collateralAmount, args.collateralPrecision),
          depositorAddress: args.user,
          morphoBlueMarket: {
            loanToken: position.marketParams.loanToken,
            collateralToken: position.marketParams.collateralToken,
            oracle: position.marketParams.oracle,
            irm: position.marketParams.irm,
            lltv: position.marketParams.lltv.times(TEN.pow(18)),
          },
        }
      : undefined,
    args.quoteAmount.gt(0)
      ? {
          morphoBlueMarket: {
            loanToken: position.marketParams.loanToken,
            collateralToken: position.marketParams.collateralToken,
            oracle: position.marketParams.oracle,
            irm: position.marketParams.irm,
            lltv: position.marketParams.lltv.times(TEN.pow(18)),
          },
          amountToBorrow: amountToWei(args.quoteAmount, args.quotePrecision),
          isEthToken: isBorrowingEth,
        }
      : undefined,
    dependencies.addresses,
    dependencies.network,
  )

  const targetPosition = position.deposit(args.collateralAmount).borrow(args.quoteAmount)

  const warnings = [...validateGenerateCloseToMaxLtv(targetPosition, position)]

  const errors = [
    ...validateLiquidity(position, targetPosition, args.quoteAmount),
    ...validateBorrowUndercollateralized(targetPosition, position, args.quoteAmount),
  ]

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
      value: isDepositingEth ? amountToWei(args.collateralAmount, 18).toString() : '0',
    },
  }
}
