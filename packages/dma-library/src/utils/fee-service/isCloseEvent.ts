import { supportedCloseEvents } from './constants'
const regex = new RegExp(supportedCloseEvents.join('|'))

export const isCloseEvent = (event: { kind: string }): boolean => {
  return regex.test(event.kind)
}
