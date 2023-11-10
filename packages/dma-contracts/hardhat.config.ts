import './hardhat.config.base.ts'

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
import './tasks/deploy'
import './tasks/create-position'
import './tasks/proxy'
import './tasks/verify-earn'
import './tasks/transfer-erc20'
import './tasks/get-tokens'
import './tasks/read-erc20-balance'
import './tasks/user-dpm-proxies'
import './tasks/transfer-dpm'
import './tasks/deploy-ajna'
import './tasks/get-hashes'
import './tasks/verify-deployment'
import './tasks/verify-operations'
import './tasks/generate-op-tuple'
import './tasks/get-action-name'
import './tasks/service-registry'
import './tasks/operations-registry'
import './tasks/ownership-tool'
import './tasks/validate-multisig-tx'

export { default } from './hardhat.config.base'
