export {
  coalesceNetwork,
  getAddressesFor,
  isMainnetByNetwork,
  isOptimismByNetwork,
} from './addresses'
export { buildBytecode, buildCreate2Address, saltToHex } from './create2'
export { etherscanAPIUrl } from './etherscan'
export { logDebug } from './log-debug'
export { amountFromWei, amountToWei } from './precision'
export {
  bignumberToTopic,
  forgeUnoswapCalldata,
  generateRandomAddress,
  generateTpOrSlExecutionData,
  getEvents,
  getServiceNameHash,
  isLocalNetwork,
  toRatio,
} from './utils'
