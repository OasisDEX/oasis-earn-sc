import {
  AAVEStrategyAddresses,
  AAVEV3StrategyAddresses,
  protocols,
  strategies,
  SwapData,
} from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type StrategiesDependencies = {
  addresses: (AAVEStrategyAddresses | AAVEV3StrategyAddresses) & { accountFactory: string }
  contracts: { operationExecutor: ethers.Contract }
  provider: ethers.providers.Provider
  protocol: {
    version: 2 | 3
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
