import { adjust } from './adjust'
import { close } from './close'
import { depositBorrow } from './depositBorrow'
import { getCurrentPosition } from './getCurrentPosition'
import { open } from './open'

export const aave = {
  open: open,
  close: close,
  adjust: adjust,
  view: getCurrentPosition,
  depositBorrow,
}
