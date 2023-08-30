import { GetAaveProtocolData } from '@dma-library/protocols/aave'
import { AaveVersion } from '@dma-library/types/aave'
import {
  AaveGetCurrentPositionArgs,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
} from '@dma-library/views/aave'

import { AavePosition } from './aave-position'

export type WithV2Protocol = {
  protocol: {
    version: AaveVersion.v2
    getCurrentPosition: (
      args: AaveGetCurrentPositionArgs,
      deps: AaveV2GetCurrentPositionDependencies,
    ) => Promise<AavePosition>
    getProtocolData: GetAaveProtocolData
  }
}

export type WithV3Protocol = {
  protocol: {
    version: AaveVersion.v3
    getCurrentPosition: (
      args: AaveGetCurrentPositionArgs,
      deps: AaveV3GetCurrentPositionDependencies,
    ) => Promise<AavePosition>
    getProtocolData: GetAaveProtocolData
  }
}
