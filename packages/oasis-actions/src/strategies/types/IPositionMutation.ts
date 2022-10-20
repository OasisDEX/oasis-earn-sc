import BigNumber from 'bignumber.js'

import { ActionCall } from '../../actions/types/actionCall'
import { IPositionChange, Swap } from '../../helpers/calculations/Position'
import { IRiskRatio } from '../../helpers/calculations/RiskRatio'
import { SwapData } from './SwapData'

interface ISimulatedMutation extends IPositionChange {
  prices: { debtTokenPrice: BigNumber; collateralTokenPrices: BigNumber | BigNumber[] }
  swap: SwapData & Swap
  minConfigurableRiskRatio: IRiskRatio
}

export interface IPositionMutation {
  calls: ActionCall[]
  simulation: ISimulatedMutation
}
