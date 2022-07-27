import { ServiceRegistry } from '../wrappers/serviceRegistry'
import * as actions from './actions'

type Actions = typeof actions

type ApplyRegistry<A> = {
  [K in keyof A]: A[K] extends (registry: ServiceRegistry, ...args: infer P) => infer R
    ? (...args: P) => Promise<R>
    : never
}

export function makeActions(registry: ServiceRegistry): ApplyRegistry<Actions> {
  return Object.entries(actions).reduce(
    (acc, [name, actionCreator]) => ({
      ...acc,
      [name]: (args: any) => actionCreator(registry, args),
    }),
    {} as ApplyRegistry<Actions>,
  )
}
