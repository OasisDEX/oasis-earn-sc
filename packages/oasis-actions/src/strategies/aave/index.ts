import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { IPositionRepository } from '../types/IPositionRepository'
import { adjustStEth } from './adjust'
import { close } from './close'
import { open } from './open'

export const aave: IPositionRepository<AAVEStrategyAddresses> = {
  open: open,
  close: close,
  adjust: adjustStEth,
  view: () => {
    throw new Error('View not implemented')
  },
}
