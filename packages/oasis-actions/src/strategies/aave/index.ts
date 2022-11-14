import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { IPositionRepository } from '../types/IPositionRepository'
import { adjust } from './adjust'
import { close } from './close'
import { getCurrentPosition } from './getCurrentPosition'
import { open } from './open'

export const aave: IPositionRepository<AAVEStrategyAddresses> = {
  open: open,
  close: close,
  adjust: adjust,
<<<<<<< HEAD
  view: getCurrentPosition,
=======
  view: () => {
    throw new Error('View not implemented')
  },
>>>>>>> e7706c6 (refactor: adjuststeth tests)
}
