import { AaveProtocolData, AaveProtocolDataArgs } from '../../protocols/aave/get-aave-protocol-data'
import { AaveVersion } from '../../strategies'
import {
  AaveGetCurrentPositionArgs,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
} from '../../strategies/aave/get-current-position'
import { AavePosition } from './aave-position'

export type WithV2Protocol = {
  protocol: {
    version: AaveVersion.v2
    getCurrentPosition: (
      args: AaveGetCurrentPositionArgs,
      deps: AaveV2GetCurrentPositionDependencies,
    ) => Promise<AavePosition>
    getProtocolData: (args: AaveProtocolDataArgs) => AaveProtocolData
  }
}

export type WithV3Protocol = {
  protocol: {
    version: AaveVersion.v3
    getCurrentPosition: (
      args: AaveGetCurrentPositionArgs,
      deps: AaveV3GetCurrentPositionDependencies,
    ) => Promise<AavePosition>
    getProtocolData: (args: AaveProtocolDataArgs) => AaveProtocolData
  }
}
