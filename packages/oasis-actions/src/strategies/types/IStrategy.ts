import BigNumber from 'bignumber.js'

import { ActionCall } from '../../actions/types/actionCall'
import { IRiskRatio } from '../../helpers/calculations/RiskRatio'
import { IVaultChange } from '../../helpers/calculations/Vault'
import { SwapData } from './SwapData'

interface ISimulation extends IVaultChange {
  prices: { debtTokenPrice: BigNumber; collateralTokenPrices: BigNumber | BigNumber[] }
  swap: SwapData & { fee: BigNumber }
  minConfigurableRiskRatio: IRiskRatio
}

export interface IStrategy {
  calls: ActionCall[]
  simulation: ISimulation
}
