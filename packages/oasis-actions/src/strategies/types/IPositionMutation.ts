import BigNumber from 'bignumber.js'

import { ActionCall } from '../../actions/types/actionCall'
import { IPositionChange, Swap } from '../../helpers/calculations/Position'
import { IRiskRatio } from '../../helpers/calculations/RiskRatio'
import { OperationNames } from '../../helpers/constants'
import { SwapData } from './SwapData'

interface ISimulatedMutation extends IPositionChange {
  prices: { debtTokenPrice: BigNumber; collateralTokenPrices: BigNumber | BigNumber[] }
  swap: SwapData & Swap
  minConfigurableRiskRatio: IRiskRatio
}

export interface IPositionMutation {
  transaction: {
    calls: ActionCall[]
    // operationName: OperationNames
    operationName: 'CUSTOM_OPERATION'
  }
  simulation: ISimulatedMutation
}
