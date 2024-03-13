import { Network } from '@deploy-configurations/types/network'
import { Address } from '@dma-common/types'
import { amountToWei } from '@dma-common/utils/common'
import { operations } from '@dma-library/operations'
import { AaveLikeStrategyAddresses } from '@dma-library/operations/aave-like/addresses'
import { getGenericSwapData } from '@dma-library/strategies/common'
import { SummerStrategy } from '@dma-library/types'
import { GetSwapData } from '@dma-library/types/common'
import { encodeOperation } from '@dma-library/utils/operation'
import { isCorrelatedPosition } from '@dma-library/utils/swap'
import { views } from '@dma-library/views'
import { Erc4646ViewDependencies } from '@dma-library/views/common/erc4626'
import { Erc4626Position } from '@dma-library/views/common/types'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export interface Erc4626DepositPayload {
  pullTokenSymbol: string
  pullTokenPrecision: number
  pullTokenAddress: Address
  depositTokenSymbol: string
  depositTokenPrecision: number
  depositTokenAddress: Address
  amount: BigNumber
  vault: string
  proxyAddress: Address
  user: Address
  slippage: BigNumber
  quoteTokenPrice: BigNumber
}
export interface Erc4626CommonDependencies {
  provider: ethers.providers.Provider
  network: Network
  addresses: AaveLikeStrategyAddresses
  operationExecutor: Address
  getSwapData: GetSwapData
}

export type Erc4626DepositStrategy = (
  args: Erc4626DepositPayload,
  dependencies: Erc4626CommonDependencies & Erc4646ViewDependencies,
) => Promise<SummerStrategy<Erc4626Position>>

export const deposit: Erc4626DepositStrategy = async (args, dependencies) => {
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

  const isPullingEth =
    args.pullTokenAddress.toLowerCase() === dependencies.addresses.tokens.WETH.toLowerCase()

  const isSwapping = args.depositTokenAddress.toLowerCase() !== args.pullTokenAddress.toLowerCase()

  if (isSwapping) {
    const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(args, dependencies)
    const operation = await operations.erc4626Operations.deposit(
      {
        vault: args.vault,
        depositToken: args.depositTokenAddress,
        pullToken: args.pullTokenAddress,
        amountToDeposit: amountToWei(args.amount, args.pullTokenPrecision),
        isPullingEth: isPullingEth,
        swap: {
          fee: 20,
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
      dependencies.addresses,
      dependencies.network,
    )

    const targetPosition = position.deposit(swapData.minToTokenAmount)

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
          // Ajna is always DPM
          isDPMProxy: true,
          owner: args.user,
        },
        isOpen,
      },
      dependencies.addresses,
      dependencies.network,
    )

    const targetPosition = position.deposit(amountToWei(args.amount, args.pullTokenPrecision))

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
    __feeOverride: isCorrelatedPosition(args.pullTokenSymbol, args.depositTokenSymbol)
      ? new BigNumber(2)
      : new BigNumber(20),
  })
}
