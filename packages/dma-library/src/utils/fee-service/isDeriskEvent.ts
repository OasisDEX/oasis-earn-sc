import { supportedDeriskEvents } from './constants'
const regex = new RegExp(supportedDeriskEvents.join('|'))

export const isDeriskEvent = (event: { kind: string }): boolean => {
  return regex.test(event.kind)
}
