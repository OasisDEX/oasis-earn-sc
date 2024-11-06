import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { DepositArgs } from '@dma-library/operations'
import { getAaveTokenAddress } from '@dma-library/strategies/aave/common'
import { AaveLikeTokens, SwapData } from '@dma-library/types'
import { getPositionDataAaveLike } from '@dma-library/utils/fee-service'
import * as SwapUtils from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

import type { AaveLikeDepositBorrowDependencies } from '../../aave-like/borrow/deposit-borrow'
import type { AaveLikeOpenDepositBorrowDependencies } from '../../aave-like/borrow/open-deposit-borrow'

export async function buildDepositBorrowArgs(
  entryToken: { symbol: AaveLikeTokens },
  collateralToken: { symbol: AaveLikeTokens },
  collateralTokenAddress: Address,
  entryTokenAmount: BigNumber,
  slippage: BigNumber,
  dependencies: AaveLikeDepositBorrowDependencies | AaveLikeOpenDepositBorrowDependencies,
  alwaysReturnArgs = false,
): Promise<{
  swap:
    | {
        data: SwapData
        fee: BigNumber
        collectFeeFrom: 'sourceToken' | 'targetToken'
      }
    | undefined
  args: DepositArgs | undefined
  collateralDelta: BigNumber
}> {
  // Note: assumes when Entry token is ETH/WETH in params then we're working with ETH being wrapped into WETH
  // And therefore Pull actions should be skipped.
  // Assumes user's never directly send WETH
  const entryTokenIsEth = entryToken?.symbol === 'ETH' || entryToken?.symbol === 'WETH'
  const entryTokenAddress = getAaveTokenAddress(entryToken, dependencies.addresses)
  const collateralSymbol = collateralToken.symbol

  const isDepositNeeded = entryToken && entryTokenAmount && slippage && entryTokenAmount.gt(ZERO)
  if (!alwaysReturnArgs && !isDepositNeeded)
    return { args: undefined, collateralDelta: ZERO, swap: undefined }

  const isSwapNeeded = SwapUtils.getIsSwapNeeded(
    entryTokenAddress,
    collateralTokenAddress,
    dependencies.addresses.tokens.ETH,
    dependencies.addresses.tokens.WETH,
  )

  const collectFeeFrom = SwapUtils.acceptedFeeTokenBySymbol({
    fromTokenSymbol: entryToken.symbol,
    toTokenSymbol: collateralSymbol,
  })

  const depositArgs = {
    depositorAddress: dependencies.user,
    depositToken:
      collateralTokenAddress.toLowerCase() === dependencies.addresses.tokens.ETH.toLowerCase()
        ? dependencies.addresses.tokens.WETH
        : collateralTokenAddress,
    entryTokenAddress: entryTokenAddress,
    entryTokenIsEth,
    amountInBaseUnit: entryTokenAmount,
    isSwapNeeded,
    swapArgs: undefined,
  }
  if (isSwapNeeded) {
    if (!dependencies.getSwapData) throw new Error('Swap data is required for swap to be performed')

    const collectFeeInFromToken = collectFeeFrom === 'sourceToken'
    const fee = await SwapUtils.feeResolver(entryToken.symbol, collateralSymbol, {
      isEntrySwap: true,
      positionData: getPositionDataAaveLike(dependencies),
    })

    const { swapData } = await SwapUtils.getSwapDataHelper<
      typeof dependencies.addresses,
      AaveLikeTokens
    >({
      args: {
        fromToken: entryToken,
        toToken: collateralToken,
        slippage,
        fee: fee.feeToCharge,
        feeType: fee.feeType,
        swapAmountBeforeFees: entryTokenAmount,
      },
      addresses: dependencies.addresses,
      services: {
        getSwapData: dependencies.getSwapData,
        getTokenAddress: getAaveTokenAddress,
      },
    })

    const swapArgs = {
      calldata: swapData.exchangeCalldata.toString(),
      collectFeeInFromToken,
      fee: fee.feeToCharge.toNumber(),
      receiveAtLeast: swapData.minToTokenAmount,
    }

    // If a swap is needed, the collateral delta is min to token amount (amount of collateral received)
    const collateralDelta = swapData.minToTokenAmount

    // Estimated fee collected from Swap
    const swapFee = SwapUtils.calculateSwapFeeAmount(
      collectFeeFrom,
      entryTokenAmount,
      swapData.toTokenAmount,
      fee.feeToCharge,
      fee.feeType,
    )

    return {
      args: {
        ...depositArgs,
        swapArgs,
      },
      collateralDelta,
      swap: {
        data: swapData,
        fee: swapFee,
        collectFeeFrom,
      },
    }
  }

  if (!isSwapNeeded) {
    // If no swap is needed, the collateral delta is the same as the entry token amount (deposit amount)
    const collateralDelta = entryTokenAmount

    return {
      args: depositArgs,
      collateralDelta,
      swap: undefined,
    }
  }

  throw new Error('No deposit args found')
}
