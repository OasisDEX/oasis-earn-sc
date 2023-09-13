import { GetAaveProtocolData } from '@dma-library/protocols/aave'
import { AaveVersion } from '@dma-library/types/aave'
import { AaveLikePosition } from '@dma-library/types/aave-like'
import {
  AaveGetCurrentPositionArgs,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
} from '@dma-library/views/aave'

export type WithV2Protocol = {
  protocol: {
    version: AaveVersion.v2
    getCurrentPosition: (
      args: AaveGetCurrentPositionArgs,
      deps: AaveV2GetCurrentPositionDependencies,
    ) => Promise<AaveLikePosition>
    getProtocolData: GetAaveProtocolData
  }
}

export type WithV3Protocol = {
  protocol: {
    version: AaveVersion.v3
    getCurrentPosition: (
      args: AaveGetCurrentPositionArgs,
      deps: AaveV3GetCurrentPositionDependencies,
    ) => Promise<AaveLikePosition>
    getProtocolData: GetAaveProtocolData
  }
}
