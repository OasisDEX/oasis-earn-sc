import { assert } from 'console'

export function isDefined<T>(x: T | undefined, message: string): x is T {
  assert(x, message)

  return true
}
