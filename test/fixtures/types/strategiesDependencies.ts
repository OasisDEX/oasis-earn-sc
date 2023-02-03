import {
  AAVEStrategyAddresses,
  AAVEV3StrategyAddresses,
  AaveVersion,
  protocols,
  strategies,
  SwapData,
} from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

type BaseStrategiesDependencies<Addresses, AaveVersion> = {
  addresses: Addresses & { accountFactory: string }
  contracts: { operationExecutor: ethers.Contract }
  provider: ethers.providers.Provider
  protocol: {
    version: AaveVersion
    getCurrentPosition: typeof strategies.aave.view
    getProtocolData: typeof protocols.aave.getAaveProtocolData
  }
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

export type StrategyDependenciesAaveV2 = BaseStrategiesDependencies<
  AAVEStrategyAddresses,
  AaveVersion.v2
>
export type StrategyDependenciesAaveV3 = BaseStrategiesDependencies<
  AAVEV3StrategyAddresses,
  AaveVersion.v3
>

export type StrategiesDependencies = StrategyDependenciesAaveV2 | StrategyDependenciesAaveV3
