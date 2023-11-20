import { Network } from '@deploy-configurations/types/network'

export function loadContractNames(network: Network) {
  let loadedConfig

  if (network === Network.MAINNET) {
    loadedConfig = require('./contract-names.mainnet')
  } else if (network === Network.OPTIMISM) {
    loadedConfig = require('./contract-names.optimism')
  } else if (network === Network.ARBITRUM) {
    loadedConfig = require('./contract-names.arbitrum')
  } else if (network === Network.BASE) {
    loadedConfig = require('./contract-names.base')
  } else if (network === Network.GOERLI) {
    loadedConfig = require('./contract-names.mainnet')
  } else if (network === Network.SEPOLIA) {
    loadedConfig = require('./contract-names.mainnet')
  } else if (network === Network.LOCAL) {
    loadedConfig = require('./contract-names.local')
  } else if (network === Network.TEST) {
    loadedConfig = require('./contract-names.test')
  } else {
    throw new Error(`Invalid network: ${network}`)
  }

  return loadedConfig.SERVICE_REGISTRY_NAMES
}
