let keepTrying
let MAX_RETRIES = 2

export async function retrySetup<T>(setup: () => Promise<T>): Promise<T | undefined> {
  do {
    try {
      return await setup()
      keepTrying = false
    } catch {
      keepTrying = true
      MAX_RETRIES--
    }
  } while (keepTrying)
}
