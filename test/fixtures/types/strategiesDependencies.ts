import {
  AaveVersion,
  protocols,
  strategies,
  SwapData,
} from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

type AaveV2Protocol = {
  version: AaveVersion.v2
  getCurrentPosition: typeof strategies.aave.v2.view
  getProtocolData: typeof protocols.aave.getAaveProtocolData
}

type AaveV3Protocol = {
  version: AaveVersion.v3
  getCurrentPosition: typeof strategies.aave.v3.view
  getProtocolData: typeof protocols.aave.getAaveProtocolData
}

type BaseStrategiesDependencies = {
  provider: ethers.providers.Provider // todo: remove - available in Deployment System 
  protocol: AaveV2Protocol | AaveV3Protocol
  getSwapData: (
    ...args: any[]
  ) => (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  user: string  // todo: remove - available in Deployment System
}

export type StrategyDependenciesAaveV2 = Omit<
  BaseStrategiesDependencies,
  'protocol'
> & { protocol: AaveV2Protocol;  }

export type StrategyDependenciesAaveV3 = Omit<
  BaseStrategiesDependencies,
  'protocol'
> & { protocol: AaveV3Protocol; }

export type StrategiesDependencies = StrategyDependenciesAaveV2 | StrategyDependenciesAaveV3
