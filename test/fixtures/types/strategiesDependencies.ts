import { AAVEStrategyAddresses, SwapData } from '@oasisdex/oasis-actions'
import BigNumber from 'bignumber.js'
import { ethers } from 'ethers'

export type StrategiesDependencies = {
  addresses: AAVEStrategyAddresses & { accountFactory: string }
  contracts: { operationExecutor: ethers.Contract }
  provider: ethers.providers.Provider
  getSwapData: (
    marketPrice: BigNumber,
    precision: {
      from: number
      to: number
    },
  ) => (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
  user: string
}
