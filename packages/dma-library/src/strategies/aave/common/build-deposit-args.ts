import { Address } from '@deploy-configurations/types/address'
import { ZERO } from '@dma-common/constants'
import { DepositArgs } from '@dma-library/operations'
import { AAVEV2StrategyAddresses } from '@dma-library/operations/aave/v2/addresses'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3'
import { getAaveTokenAddress } from '@dma-library/strategies'
import { AAVETokens, SwapData } from '@dma-library/types'
import { WithOptionalSwap } from '@dma-library/types/strategy-params'
import * as SwapUtils from '@dma-library/utils/swap'
import BigNumber from 'bignumber.js'

export async function buildDepositArgs(
  entryToken: { symbol: AAVETokens },
  collateralToken: { symbol: AAVETokens },
  collateralTokenAddress: Address,
  entryTokenAmount: BigNumber,
  slippage: BigNumber,
  dependencies: {
    user: Address
    addresses: AAVEV3StrategyAddresses | AAVEV2StrategyAddresses
  } & WithOptionalSwap,
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
  const entryTokenIsEth = entryToken?.symbol === 'ETH'
  const entryTokenAddress = getAaveTokenAddress(entryToken, dependencies.addresses)
  const collateralSymbol = collateralToken.symbol

  const isDepositNeeded = entryToken && entryTokenAmount && slippage && entryTokenAmount.gt(ZERO)
  if (!alwaysReturnArgs && !isDepositNeeded)
    return { args: undefined, collateralDelta: ZERO, swap: undefined }

  const isSwapNeeded = SwapUtils.getIsSwapNeeded(
    entryTokenAddress,
    collateralTokenAddress,
    dependencies.addresses.ETH,
    dependencies.addresses.WETH,
  )
  const collectFeeFrom = SwapUtils.acceptedFeeTokenBySymbol({
    fromTokenSymbol: entryToken.symbol,
    toTokenSymbol: collateralSymbol,
  })

  const depositArgs = {
    depositorAddress: dependencies.user,
    depositToken:
      collateralTokenAddress.toLowerCase() === dependencies.addresses.ETH.toLowerCase()
        ? dependencies.addresses.WETH
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
    const fee = SwapUtils.feeResolver(entryToken.symbol, collateralSymbol, {
      isEntrySwap: true,
    })

    const { swapData } = await SwapUtils.getSwapDataHelper<
      typeof dependencies.addresses,
      AAVETokens
    >({
      args: {
        fromToken: entryToken,
        toToken: collateralToken,
        slippage,
        fee,
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
      fee: fee.toNumber(),
      receiveAtLeast: swapData.minToTokenAmount,
    }

    // If a swap is needed, the collateral delta is to token amount (amount of collateral received)
    const collateralDelta = swapData.minToTokenAmount

    // Estimated fee collected from Swap
    const swapFee = SwapUtils.calculateSwapFeeAmount(
      collectFeeFrom,
      entryTokenAmount,
      swapData.toTokenAmount,
      fee,
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
