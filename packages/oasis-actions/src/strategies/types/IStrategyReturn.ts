import BigNumber from 'bignumber.js'

import { ActionCall } from '../../actions/types/actionCall'
import { IPositionChange } from '../../helpers/calculations/Position'
import { IRiskRatio } from '../../helpers/calculations/RiskRatio'
import { SwapData } from './SwapData'

interface ISimulation extends IPositionChange {
  prices: { debtTokenPrice: BigNumber; collateralTokenPrices: BigNumber | BigNumber[] }
  swap: SwapData & { sourceTokenFee: BigNumber; targetTokenFee: BigNumber }
  minConfigurableRiskRatio: IRiskRatio
}

export interface IStrategyReturn {
  calls: ActionCall[]
  simulation: ISimulation
}
