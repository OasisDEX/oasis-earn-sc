import { ADDRESSES, SystemKeys } from '@deploy-configurations/addresses'
import { amountToWei } from '@dma-common/utils/common'
import { operations } from '@dma-library/operations'
import { getGenericSwapData } from '@dma-library/strategies/common'
import { encodeOperation } from '@dma-library/utils/operation'
import { views } from '@dma-library/views'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

import {
  Erc4626CommonDependencies,
  Erc4626DepositPayload,
  Erc4626DepositStrategy,
} from '../../../types/common'
import { validateMaxDeposit } from './validation/validate-max-deposit'

export const deposit: Erc4626DepositStrategy = async (args, dependencies) => {
  const addresses = { tokens: { ...ADDRESSES[dependencies.network][SystemKeys.COMMON] } }

  const getPosition = views.common.getErc4626Position
  const position = await getPosition(
    {
      vaultAddress: args.vault,
      proxyAddress: args.proxyAddress,
      user: args.user,
      quotePrice: args.quoteTokenPrice,
      underlyingAsset: {
        address: args.depositTokenAddress,
        precision: args.depositTokenPrecision,
        symbol: args.depositTokenSymbol,
      },
    },
    {
      provider: dependencies.provider,
      getLazyVaultSubgraphResponse: dependencies.getLazyVaultSubgraphResponse,
      getVaultApyParameters: dependencies.getVaultApyParameters,
    },
  )
  const isOpen = position.netValue.toString() === '0'

  const isPullingEth = args.pullTokenAddress.toLowerCase() === addresses.tokens.WETH.toLowerCase()

  const isSwapping = args.depositTokenAddress.toLowerCase() !== args.pullTokenAddress.toLowerCase()

  if (isSwapping) {
    const { swapData, collectFeeFrom, fee, tokenFee } = await getSwapData(args, dependencies)
    const operation = await operations.erc4626Operations.deposit(
      {
        vault: args.vault,
        depositToken: args.depositTokenAddress,
        pullToken: args.pullTokenAddress,
        amountToDeposit: amountToWei(args.amount, args.pullTokenPrecision),
        isPullingEth: isPullingEth,
        swap: {
          fee: fee,
          data: swapData.exchangeCalldata,
          amount: amountToWei(args.amount, args.pullTokenPrecision),
          collectFeeFrom,
          receiveAtLeast: swapData.minToTokenAmount,
        },
        proxy: {
          address: args.proxyAddress,
          isDPMProxy: true,
          owner: args.user,
        },
        isOpen,
      },
      dependencies.network,
    )
    const depositAmount = new BigNumber(
      ethers.utils
        .formatUnits(swapData.minToTokenAmount.toString(), args.depositTokenPrecision)
        .toString(),
    )
    const targetPosition = position.deposit(depositAmount)

    const warnings = []

    const errors = [...validateMaxDeposit(depositAmount, position)]

    const swap = {
      fromTokenAddress: args.pullTokenAddress,
      toTokenAddress: args.depositTokenAddress,
      fromTokenAmount: amountToWei(args.amount, args.pullTokenPrecision),
      toTokenAmount: swapData.toTokenAmount,
      minToTokenAmount: swapData.minToTokenAmount,
      tokenFee: tokenFee,
      collectFeeFrom: collectFeeFrom,
      exchangeCalldata: swapData.exchangeCalldata,
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
        value: isPullingEth ? amountToWei(args.amount, 18).toString() : '0',
      },
    }
  } else {
    const operation = await operations.erc4626Operations.deposit(
      {
        vault: args.vault,
        depositToken: args.depositTokenAddress,
        pullToken: args.pullTokenAddress,
        amountToDeposit: amountToWei(args.amount, args.pullTokenPrecision),
        isPullingEth: isPullingEth,

        proxy: {
          address: args.proxyAddress,
          isDPMProxy: true,
          owner: args.user,
        },
        isOpen,
      },
      dependencies.network,
    )

    const targetPosition = position.deposit(args.amount)

    const warnings = []

    const errors = [...validateMaxDeposit(args.amount, position)]

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
        value: isPullingEth ? amountToWei(args.amount, 18).toString() : '0',
      },
    }
  }
}

async function getSwapData(args: Erc4626DepositPayload, dependencies: Erc4626CommonDependencies) {
  const swapAmountBeforeFees = amountToWei(args.amount, args.pullTokenPrecision).integerValue(
    BigNumber.ROUND_DOWN,
  )

  const fromToken = {
    symbol: args.pullTokenSymbol,
    precision: args.pullTokenPrecision,
    address: args.pullTokenAddress,
  }
  const toToken = {
    symbol: args.depositTokenSymbol,
    precision: args.depositTokenPrecision,
    address: args.depositTokenAddress,
  }

  return getGenericSwapData({
    fromToken,
    toToken,
    slippage: args.slippage,
    swapAmountBeforeFees: swapAmountBeforeFees,
    getSwapData: dependencies.getSwapData,
  })
}
