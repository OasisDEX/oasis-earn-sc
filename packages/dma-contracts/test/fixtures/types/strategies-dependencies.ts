import {
  AAVEStrategyAddresses,
  AAVEV3StrategyAddresses,
  AaveVersion,
  protocols,
  strategies,
  SwapData,
} from '@dma-library'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type AaveV2Protocol = {
  version: AaveVersion.v2
  getCurrentPosition: typeof strategies.aave.v2.view
  getProtocolData: typeof protocols.aave.getAaveProtocolData
}

export type AaveV3Protocol = {
  version: AaveVersion.v3
  getCurrentPosition: typeof strategies.aave.v3.view
  getProtocolData: typeof protocols.aave.getAaveProtocolData
}

type BaseStrategiesDependencies = {
  contracts: { operationExecutor: ethers.Contract }
  provider: ethers.providers.Provider
  protocol: AaveV2Protocol | AaveV3Protocol
  getSwapData: (
    ...args: any[]
  ) => (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  user: string
}

export type StrategyDependenciesAaveV2 = Omit<
  BaseStrategiesDependencies,
  'addresses' | 'protocol'
> & { protocol: AaveV2Protocol; addresses: AAVEStrategyAddresses & { accountFactory?: string } }

export type StrategyDependenciesAaveV3 = Omit<
  BaseStrategiesDependencies,
  'addresses' | 'protocol'
> & { protocol: AaveV3Protocol; addresses: AAVEV3StrategyAddresses & { accountFactory?: string } }

export type StrategiesDependencies = StrategyDependenciesAaveV2 | StrategyDependenciesAaveV3
