export function isDefined<T>(x: T | undefined, message: string): x is T {
  console.assert(x !== undefined && x !== null, message)

  return true
}
