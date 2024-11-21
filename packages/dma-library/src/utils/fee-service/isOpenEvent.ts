import { supportedOpenEvents } from './constants'
const regex = new RegExp(supportedOpenEvents.join('|'))

export const isOpenEvent = (event: { kind: string }): boolean => {
  return regex.test(event.kind)
}
