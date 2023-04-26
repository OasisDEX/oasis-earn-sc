import { ZERO } from '@oasisdex/dma-common/constants'
import { Address } from '@oasisdex/dma-deployments/types/address'
import { IRiskRatio, Position } from '@oasisdex/domain/src'
import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

import { SwapData } from '../../../types'
import { Strategy } from '../../../types/common'

export interface OpenArgs {
  depositedByUser?: {
    collateralToken?: { amountInBaseUnit: BigNumber }
    debtToken?: { amountInBaseUnit: BigNumber }
  }
  multiple: IRiskRatio
  slippage: BigNumber
  collateralToken: { symbol: string; precision?: number }
  debtToken: { symbol: string; precision?: number }
}

export interface OpenDependencies {
  proxy: Address
  user: Address
  isDPMProxy: boolean
  /* Services below 👇*/
  provider: providers.Provider
  getSwapData: (
    fromToken: string,
    toToken: string,
    amount: BigNumber,
    slippage: BigNumber,
  ) => Promise<SwapData>
}

export async function open(
  args: OpenArgs,
  dependencies: OpenDependencies,
): Promise<Strategy<Position>> {
  const newPosition = new Position(
    {
      amount: ZERO,
      symbol: args.debtToken.symbol,
      precision: args.debtToken.precision,
    },
    {
      amount: ZERO,
      symbol: args.collateralToken.symbol,
      precision: args.collateralToken.precision,
    },
    ZERO,
    {
      dustLimit: ZERO,
      liquidationThreshold: ZERO,
      maxLoanToValue: ZERO,
    },
  )
  return {
    simulation: {
      errors: [],
      position: newPosition,
      targetPosition: newPosition,
      swaps: [],
      delta: { collateral: ZERO, debt: ZERO, flashloanAmount: ZERO },
    },
    tx: {
      data: '',
      to: dependencies.proxy,
      value: '0',
    },
  }
}
