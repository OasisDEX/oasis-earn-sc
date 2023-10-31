import './hardhat.config.base'

/*
 * Tasks
 *
 * Note, now that ABIs are not committed
 * There exists a circular dependency between
 * in tasks that import from the library
 *
 * Historic examples being:
 * import './tasks/create-aave-v3l1-position'
 * import './tasks/create-multiply-position'
 * import './tasks/create-borrow-position'
 *
 * Instead please use the `run-dependent-task.ts` script
 * Which can be found at /scripts/run-dependent-task.ts
 *
 * Example:
 * yarn hardhat run scripts/run-dependent-task.ts --network local
 * And then follow the prompts
 */
import './tasks/fetch-morpho-values'

export { default } from './hardhat.config.base'
