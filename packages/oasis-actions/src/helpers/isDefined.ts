import { assert } from 'console'

export function isDefined<T>(x: T | undefined, message: string): x is T {
  assert(x !== undefined && x !== null, message)

  return true
}
