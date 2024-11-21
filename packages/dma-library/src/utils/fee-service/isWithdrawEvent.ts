import { supportedWithdrawEvents } from './constants'
const regex = new RegExp(supportedWithdrawEvents.join('|'))

export const isWithdrawEvent = (event: { kind: string }): boolean => {
  return regex.test(event.kind)
}
