import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2/addresses'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3/addresses'

type IsAaveV3Key = keyof AAVEV3StrategyAddresses
type IsAaveV2Key = keyof AAVEStrategyAddresses
type IsUniqueKeyToAaveV2 = Exclude<IsAaveV2Key, IsAaveV3Key>
type IsUniqueKeyToAaveV3 = Exclude<IsAaveV3Key, IsAaveV2Key>

const uniqueKeysToAaveV2: IsUniqueKeyToAaveV2[] = [
  'lendingPool',
  'priceOracle',
  'protocolDataProvider',
]
const uniqueKeysToAaveV3: IsUniqueKeyToAaveV3[] = ['pool', 'aaveOracle', 'poolDataProvider']

// Type guard function
export function isAaveV3Addresses(
  addresses: AAVEStrategyAddresses | AAVEV3StrategyAddresses,
): addresses is AAVEV3StrategyAddresses {
  const addressKeys = Object.keys(addresses)
  return uniqueKeysToAaveV3.every(key => addressKeys.includes(key))
}

export function isAaveV2Addresses(
  addresses: AAVEStrategyAddresses | AAVEV3StrategyAddresses,
): addresses is AAVEStrategyAddresses {
  const addressKeys = Object.keys(addresses)
  return uniqueKeysToAaveV2.every(key => addressKeys.includes(key))
}

/** @deprecated use isAaveV2Addresses */
export const aaveV2UniqueContractName: 'lendingPool' & IsUniqueKeyToAaveV2 = 'lendingPool'
/** @deprecated use isAaveV3Addresses */
export const aaveV3UniqueContractName: 'pool' & IsUniqueKeyToAaveV3 = 'pool'
