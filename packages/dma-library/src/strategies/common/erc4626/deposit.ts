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
  dependencies: Erc4626CommonDependencies,
) => Promise<SummerStrategy<Erc4626Position>>

export const deposit: Erc4626DepositStrategy = async (args, dependencies) => {
  const getPosition = views.common.getErc4626Position
  const position = await getPosition(
    {
      vaultAddress: args.vault,
      proxyAddress: args.proxyAddress,
      user: args.user,
      quotePrice: new BigNumber(1),
    },
    {
      provider: dependencies.provider,
    },
  )
  const isOpen = position.netValue.toString() === '0'
  const isDepositingEth =
    args.pullTokenAddress.toLowerCase() === dependencies.addresses.tokens.WETH.toLowerCase()
  const isSwapping = args.depositTokenAddress.toLowerCase() !== args.pullTokenAddress.toLowerCase()

  const { swapData, collectFeeFrom, preSwapFee } = await getSwapData(args, dependencies)

  const operation = await operations.erc4626Operations.deposit(
    {
      vault: args.vault,
      depositToken: args.depositTokenAddress,
      pullToken: args.pullTokenAddress,
      amountToDeposit: args.amount,
      isEthToken: isDepositingEth,
      swap: {
        fee: 20,
        data: swapData.exchangeCalldata,
        amount: args.amount,
        collectFeeFrom,
        receiveAtLeast: swapData.minToTokenAmount,
      },
      proxy: {
        address: args.proxyAddress,
        // Ajna is always DPM
        isDPMProxy: true,
        owner: args.user,
      },
      isOpen,
      isSwapping,
    },
    dependencies.addresses,
    dependencies.network,
  )

  const targetPosition = position.deposit(isSwapping ? swapData.minToTokenAmount : args.amount)

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
      value: isDepositingEth ? amountToWei(args.amount, 18).toString() : '0',
    },
  }
}

async function getSwapData(args: Erc4626DepositPayload, dependencies: Erc4626CommonDependencies) {
  const swapAmountBeforeFees = amountToWei(args.amount, args.depositTokenPrecision).integerValue(
    BigNumber.ROUND_DOWN,
  )

  const fromToken = {
    symbol: args.pullTokenSymbol,
    precision: args.depositTokenPrecision,
    address: args.depositTokenAddress,
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
    __feeOverride: new BigNumber(20),
  })
}
