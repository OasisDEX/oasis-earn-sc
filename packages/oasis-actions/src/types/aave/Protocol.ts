import { AaveProtocolData, AaveProtocolDataArgs } from '../../protocols/aave/getAaveProtocolData'
import { AaveVersion } from '../../strategies'
import {
  AaveGetCurrentPositionArgs,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
} from '../../strategies/aave/getCurrentPosition'
import { AavePosition } from './AavePosition'

export type WithV2Protocol = {
  protocol: {
    version: AaveVersion.v2
    getCurrentPosition: (
      args: AaveGetCurrentPositionArgs,
      system: any,
      protocolVersion: AaveVersion.v2,
    ) => Promise<AavePosition>
    getProtocolData: (args: AaveProtocolDataArgs) => AaveProtocolData
  }
}

export type WithV3Protocol = {
  protocol: {
    version: AaveVersion.v3
    getCurrentPosition: (
      args: AaveGetCurrentPositionArgs,
      system: any,
      protocolVersion: AaveVersion.v3,
    ) => Promise<AavePosition>
    getProtocolData: (args: AaveProtocolDataArgs) => AaveProtocolData
  }
}
