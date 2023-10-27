import { format } from 'node:util'

type FilterFunction = (string) => boolean
type Options = {
  console?: Console
  methods: Array<keyof Console>
}
export function filterConsole(
  excludePatterns: Array<string | RegExp | FilterFunction>,
  options?: Options,
) {
  const _options = {
    console,
    methods: ['log', 'debug', 'info', 'warn', 'error'],
    ...options,
  }
  const { console: consoleObject, methods } = _options
  const originalMethods = methods.map(method => consoleObject[method])

  const check = string => {
    for (const pattern of excludePatterns) {
      if (typeof pattern === 'string') {
        if (string.includes(pattern)) {
          return true
        }
      } else if (typeof pattern === 'function') {
        if (pattern(string)) {
          return true
        }
      } else if (pattern.test(string)) {
        return true
      }
    }

    return false
  }

  for (const method of methods) {
    const originalMethod = consoleObject[method]

    consoleObject[method] = (...args) => {
      if (check(format(...args))) {
        return
      }

      originalMethod(...args)
    }
  }

  return () => {
    for (const [index, method] of methods.entries()) {
      consoleObject[method] = originalMethods[index]
    }
  }
}
