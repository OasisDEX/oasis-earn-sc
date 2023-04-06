import { AAVEStrategyAddresses } from '@dma-library/operations/aave/v2/addresses'
import { AAVEV3StrategyAddresses } from '@dma-library/operations/aave/v3/addresses'

type IsAaveV3Key = keyof AAVEV3StrategyAddresses
type IsAaveV2Key = keyof AAVEStrategyAddresses
type IsUniqueKeyToAaveV2 = Exclude<IsAaveV2Key, IsAaveV3Key>
type IsUniqueKeyToAaveV3 = Exclude<IsAaveV3Key, IsAaveV2Key>

export const aaveV2UniqueContractName: 'lendingPool' & IsUniqueKeyToAaveV2 = 'lendingPool'
export const aaveV3UniqueContractName: 'pool' & IsUniqueKeyToAaveV3 = 'pool'
