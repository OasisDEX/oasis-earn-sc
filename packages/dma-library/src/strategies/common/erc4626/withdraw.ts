import { ADDRESSES, SystemKeys } from '@deploy-configurations/addresses'
import { amountToWei } from '@dma-common/utils/common'
import { operations } from '@dma-library/operations'
import { getGenericSwapData } from '@dma-library/strategies/common'
import { encodeOperation } from '@dma-library/utils/operation'
import { views } from '@dma-library/views'
import BigNumber from 'bignumber.js'

import {
  Erc4626CommonDependencies,
  Erc4626WithdrawPayload,
  Erc4626WithdrawStrategy,
} from '../../../types/common'
import { validateMaxWithdraw } from './validation/validate-max-withdraw'

export const withdraw: Erc4626WithdrawStrategy = async (args, dependencies) => {
  const addresses = { tokens: { ...ADDRESSES[dependencies.network][SystemKeys.COMMON] } }
  const getPosition = views.common.getErc4626Position
  const position = await getPosition(
    {
      vaultAddress: args.vault,
      proxyAddress: args.proxyAddress,
      user: args.user,
      quotePrice: args.quoteTokenPrice,
      underlyingAsset: {
        address: args.withdrawTokenAddress,
        precision: args.withdrawTokenPrecision,
        symbol: args.withdrawTokenSymbol,
      },
    },
    {
      provider: dependencies.provider,
      getLazyVaultSubgraphResponse: dependencies.getLazyVaultSubgraphResponse,
      getVaultApyParameters: dependencies.getVaultApyParameters,
    },
  )

  const isReturningEth =
    args.returnTokenAddress.toLowerCase() === addresses.tokens.WETH.toLowerCase()
  const isWithdrawingEth =
    args.withdrawTokenAddress.toLowerCase() === addresses.tokens.WETH.toLowerCase()
  const isSwapping =
    args.returnTokenAddress.toLowerCase() !== args.withdrawTokenAddress.toLowerCase()

  const isClose = args.amount.isGreaterThan(position.quoteTokenAmount)

  if (isSwapping) {
    const { swapData, collectFeeFrom, fee, tokenFee } = await getSwapData(
      { ...args, amount: isClose ? position.quoteTokenAmount : args.amount },
      dependencies,
    )
    const swapInfo = {
      fee: fee,
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
        isWithdrawingEth: isWithdrawingEth,
        isReturningEth: isReturningEth,
        swap: swapInfo,
        proxy: {
          address: args.proxyAddress,
          isDPMProxy: true,
          owner: args.user,
        },
        isClose,
      },
      addresses,
      dependencies.network,
    )

    const targetPosition = position.withdraw(args.amount)

    const warnings = []

    const errors = [...validateMaxWithdraw(args.amount, position)]

    const swap = {
      fromTokenAddress: args.withdrawTokenAddress,
      toTokenAddress: args.returnTokenAddress,
      fromTokenAmount: amountToWei(args.amount, args.withdrawTokenPrecision),
      toTokenAmount: swapData.toTokenAmount,
      minToTokenAmount: swapData.minToTokenAmount,
      exchangeCalldata: swapData.exchangeCalldata,
      tokenFee: tokenFee,
      collectFeeFrom: collectFeeFrom,
    }
    return {
      simulation: {
        swaps: [swap],
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
        isWithdrawingEth: isWithdrawingEth,
        isReturningEth: isReturningEth,
        proxy: {
          address: args.proxyAddress,
          isDPMProxy: true,
          owner: args.user,
        },
        isClose,
      },
      addresses,
      dependencies.network,
    )

    const targetPosition = position.withdraw(args.amount)

    const warnings = []

    const errors = [...validateMaxWithdraw(args.amount, position)]

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
  })
}
