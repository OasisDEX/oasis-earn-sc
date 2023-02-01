import { AAVEStrategyAddresses, protocols, strategies, SwapData } from '@oasisdex/oasis-actions/src'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type StrategiesDependencies = {
  addresses: AAVEStrategyAddresses & { accountFactory: string }
  contracts: { operationExecutor: ethers.Contract }
  provider: ethers.providers.Provider
  getSwapData: (
    ...args: any[]
  ) => (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  getCurrentPosition: typeof strategies.aave.view
  getProtocolData:
    | typeof protocols.aave.getOpenProtocolData
    | typeof protocols.aave.getOpenV3ProtocolData
  user: string
}
