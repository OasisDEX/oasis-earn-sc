import { OperationNames } from '@deploy-configurations/constants'
import { AAVETokens } from '@dma-library/types/aave/tokens'
import { Delta, IPosition, IRiskRatio, Swap } from '@domain'
import { BigNumber } from 'bignumber.js'

import { ActionCall } from './action-call'
import { SwapData } from './swap-data'

export type { Swap }

/** @deprecated use ISimulationV2 instead */
export interface ISimulation {
  position: IPosition
  delta: Delta
}

export type WithSwapSimulation = {
  swap: SwapData & Swap
}

export type WithFlashloan = {
  flashloan: {
    amount: BigNumber
    token: {
      symbol: AAVETokens
      precision: number
    }
  }
}

export type WithOptionalSwapSimulation = Partial<WithSwapSimulation>

export type WithMinConfigurableRiskRatio = {
  minConfigurableRiskRatio: IRiskRatio
}

export interface IStrategy {
  transaction: {
    calls: ActionCall[]
    operationName: OperationNames
  }
  simulation: ISimulation
}

export type IMultiplyStrategy = IStrategy & {
  simulation: IStrategy['simulation'] & WithSwapSimulation
} & WithFlashloan
