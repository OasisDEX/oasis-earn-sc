import { AaveLikeProtocol } from '@dma-library/types/protocol'

type AaveLikeProtocolKeys = 'aave.v2' | 'aave.v3' | 'spark'

export const resolveProtocolKey = (protocol: AaveLikeProtocol): AaveLikeProtocolKeys => {
  switch (protocol) {
    case 'AAVE':
      return 'aave.v2'
    case 'AAVE_V3':
      return 'aave.v3'
    case 'Spark':
      return 'spark'
  }
}

type Path<T, Key extends keyof T = keyof T> = Key extends string
  ? T[Key] extends Record<string, any>
    ? `${Key}.${Path<T[Key], keyof T[Key]>}` | `${Key}`
    : never
  : never

type DeepGet<T, P extends Path<T>> = P extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Rest extends Path<T[Key]>
      ? DeepGet<T[Key], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never

export function deepGet<T, P extends Path<T>>(obj: T, path: P): DeepGet<T, P> {
  const parts = path.split('.') as string[]
  let current: any = obj

  for (const part of parts) {
    if (current[part] === undefined) return undefined
    current = current[part]
  }

  return current
}
