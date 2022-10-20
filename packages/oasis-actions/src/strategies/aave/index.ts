import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { IPositionRepository } from '../types/IPositionRepository'
import { adjustStEth } from './adjustStEth'
import { closeStEth } from './closeStEth'
import { open } from './open'

export const aave: IPositionRepository<AAVEStrategyAddresses> = {
  open: open,
  close: closeStEth,
  adjust: adjustStEth,
  view: () => {
    throw new Error('View not implemented')
  },
}
