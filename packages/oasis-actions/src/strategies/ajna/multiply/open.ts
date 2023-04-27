import BigNumber from 'bignumber.js'
import { providers } from 'ethers'

import { Position, Protocol } from '../../../domain'
import { IRiskRatio } from '../../../domain/RiskRatio'
import { ZERO } from '../../../helpers/constants'
import { Address, SwapData } from '../../../types'
import { AjnaPosition } from '../../../types/ajna'
import { Strategy } from '../../../types/common'
import { GetPoolData, getPosition } from '../../../views/ajna'

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
  poolAddress: Address
  isDPMProxy: boolean
  poolInfoAddress: Address
  getPoolData: GetPoolData
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
): Promise<Strategy<Position<AjnaPosition>>> {
  const ajnaPosition = await getPosition(
    {
      proxyAddress: dependencies.proxy,
      poolAddress: dependencies.poolAddress,
      collateralPrice: ZERO,
      quotePrice: ZERO,
    },
    {
      poolInfoAddress: dependencies.poolInfoAddress,
      provider: dependencies.provider,
      getPoolData: dependencies.getPoolData,
    },
  )
  const newPosition = new Position<AjnaPosition>(
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
    Protocol.AJNA,
    ajnaPosition,
  )
  return {
    simulation: {
      errors: [],
      warnings: [],
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
