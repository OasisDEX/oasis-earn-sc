let keepTrying
let MAX_RETRIES = 2

export async function retrySetup<T>(
  setup: () => Promise<T>,
  disableRetry?: boolean,
): Promise<T | undefined> {
  do {
    try {
      return await setup()
      keepTrying = false
    } catch {
      keepTrying = disableRetry ? false : true
      MAX_RETRIES--
    }
  } while (keepTrying && MAX_RETRIES > 0)
}
