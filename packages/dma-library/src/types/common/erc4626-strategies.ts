import { Address } from '@deploy-configurations/types/address'
import { Network } from '@deploy-configurations/types/network'
import { Erc4626Position } from '@dma-library/views/common'
import { Erc4646ViewDependencies } from '@dma-library/views/common/erc4626'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { SummerStrategy } from '../ajna'
import { GetSwapData } from './get-swap-data'

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

export type Erc4626DepositStrategy = (
  args: Erc4626DepositPayload,
  dependencies: Erc4626CommonDependencies & Erc4646ViewDependencies,
) => Promise<SummerStrategy<Erc4626Position>>

export interface Erc4626CommonDependencies {
  provider: ethers.providers.Provider
  network: Network
  operationExecutor: Address
  getSwapData: GetSwapData
}

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
  quoteTokenPrice: BigNumber
}

export type Erc4626WithdrawStrategy = (
  args: Erc4626WithdrawPayload,
  dependencies: Erc4626CommonDependencies & Erc4646ViewDependencies,
) => Promise<SummerStrategy<Erc4626Position>>
