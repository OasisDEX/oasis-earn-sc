import { AAVEStrategyAddresses } from '../../operations/aave/addresses'
import { IPositionRepository } from '../types/IPositionRepository'
import { adjust } from './adjust'
import { close } from './close'
import { deposit } from './deposit'
import { getCurrentPosition as view } from './getCurrentPosition'
import { open } from './open'

export const aave: IPositionRepository<AAVEStrategyAddresses> = {
  open,
  close,
  adjust,
  view,
  deposit,
}
