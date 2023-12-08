// Do not change test block numbers as they're linked to uniswap liquidity levels
import { Network } from '@deploy-configurations/types/network'

export const testBlockNumber = 15695000
export const testBlockNumberForAaveV3 = 18734000
export const testBlockNumberForAaveOptimismV3 = 79811107

// AJNA
export const testBlockNumbersForAjna = {
  [Network.MAINNET]: 17613461,
  [Network.OPTIMISM]: 79811107,
}

export const BLOCKS_TO_ADVANCE = 5
export const TIME_TO_ADVANCE = 60
