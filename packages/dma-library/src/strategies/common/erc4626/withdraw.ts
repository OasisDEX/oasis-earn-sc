import { Network } from '@deploy-configurations/types/network'
import { Address } from '@dma-common/types'
import { amountToWei } from '@dma-common/utils/common'
import { operations } from '@dma-library/operations'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like/addresses'
import { getGenericSwapData } from '@dma-library/strategies/common'
import { SummerStrategy } from '@dma-library/types'
import { GetSwapData } from '@dma-library/types/common'
import { encodeOperation } from '@dma-library/utils/operation'
import { views } from '@dma-library/views'
import { Erc4626Position } from '@dma-library/views/common/types'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export interface Erc4626WithdrawPayload {
  returnTokenSymbol: string
  returnTokenPrecision: number
  returnTokenAddress: Address
  withdrawTokenSymbol: string
  withdrawTokenPrecision: number
  withdrawTokenAddress: Address
  amount: BigNumber
  vault: string
  proxyAddress: Address
  user: Address
  slippage: BigNumber
}
export interface Erc4626CommonDependencies {
  provider: ethers.providers.Provider
  network: Network
  addresses: AaveLikeStrategyAddresses
  operationExecutor: Address
  getSwapData: GetSwapData
}

export type Erc4626WithdrawStrategy = (
  args: Erc4626WithdrawPayload,
  dependencies: Erc4626CommonDependencies,
) => Promise<SummerStrategy<Erc4626Position>>

export const withdraw: Erc4626WithdrawStrategy = async (args, dependencies) => {
  const getPosition = views.common.getErc4626Position
  const position = await getPosition(
    {
      vaultAddress: args.vault,
      proxyAddress: args.proxyAddress,
      user: args.user,
      // TODO: This is a hack to get the correct position
      quotePrice: new BigNumber(1),
    },
    {
      provider: dependencies.provider,
    },
  )
  // TODO
  // get asset from vault
  // get token details from ??
  const isWithdrawingEth =
    args.returnTokenAddress.toLowerCase() === dependencies.addresses.tokens.WETH.toLowerCase()
  const isSwapping =
    args.returnTokenAddress.toLowerCase() !== args.withdrawTokenAddress.toLowerCase()

  const isClose = args.amount.isGreaterThan(position.quoteTokenAmount)

  if (isSwapping) {
    const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(
      { ...args, amount: isClose ? position.quoteTokenAmount : args.amount },
      dependencies,
    )
    const swapInfo = {
      fee: 20,
      data: swapData.exchangeCalldata,
      amount: amountToWei(
        isClose ? position.quoteTokenAmount : args.amount,
        args.withdrawTokenPrecision,
      ),
      collectFeeFrom,
      receiveAtLeast: swapData.minToTokenAmount,
    }
    const operation = await operations.erc4626Operations.withdraw(
      {
        vault: args.vault,
        withdrawToken: args.withdrawTokenAddress,
        returnToken: args.returnTokenAddress,
        amountToWithdraw: amountToWei(args.amount, args.withdrawTokenPrecision),
        isEthToken: isWithdrawingEth,
        swap: swapInfo,
        proxy: {
          address: args.proxyAddress,
          // Ajna is always DPM
          isDPMProxy: true,
          owner: args.user,
        },
        isClose,
      },
      dependencies.addresses,
      dependencies.network,
    )

    const targetPosition = position.withdraw(swapData.minToTokenAmount)

    const warnings = [
      /* ...validateGenerateCloseToMaxLtv(targetPosition, position) */
    ]

    const errors = [
      // ...validateLiquidity(position, targetPosition, args.quoteAmount),
      // ...validateUndercollateralized(targetPosition, position, args.quoteAmount),
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
        value: '0',
      },
    }
  } else {
    const operation = await operations.erc4626Operations.withdraw(
      {
        vault: args.vault,
        withdrawToken: args.withdrawTokenAddress,
        returnToken: args.returnTokenAddress,
        amountToWithdraw: amountToWei(args.amount, args.withdrawTokenPrecision),
        isEthToken: isWithdrawingEth,
        proxy: {
          address: args.proxyAddress,
          // Ajna is always DPM
          isDPMProxy: true,
          owner: args.user,
        },
        isClose,
      },
      dependencies.addresses,
      dependencies.network,
    )

    const targetPosition = position.withdraw(args.amount)

    const warnings = [
      /* ...validateGenerateCloseToMaxLtv(targetPosition, position) */
    ]

    const errors = [
      // ...validateLiquidity(position, targetPosition, args.quoteAmount),
      // ...validateUndercollateralized(targetPosition, position, args.quoteAmount),
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
        value: '0',
      },
    }
  }
}

async function getSwapData(args: Erc4626WithdrawPayload, dependencies: Erc4626CommonDependencies) {
  const swapAmountBeforeFees = amountToWei(args.amount, args.withdrawTokenPrecision).integerValue(
    BigNumber.ROUND_DOWN,
  )

  const fromToken = {
    symbol: args.withdrawTokenSymbol,
    precision: args.withdrawTokenPrecision,
    address: args.withdrawTokenAddress,
  }
  const toToken = {
    symbol: args.returnTokenSymbol,
    precision: args.returnTokenPrecision,
    address: args.returnTokenAddress,
  }

  return getGenericSwapData({
    fromToken,
    toToken,
    slippage: args.slippage,
    swapAmountBeforeFees: swapAmountBeforeFees,
    getSwapData: dependencies.getSwapData,
    __feeOverride: new BigNumber(20),
  })
}
