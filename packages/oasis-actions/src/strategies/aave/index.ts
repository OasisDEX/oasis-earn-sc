import { getAaveProtocolData } from '../../protocols/aave/getAaveProtocolData'
import { adjust } from './adjust'
import { AaveAdjustArgs, AaveV2AdjustDependencies, AaveV3AdjustDependencies } from './adjust/adjust'
import { changeDebt } from './changeDebt'
import { AaveCloseArgs, AaveCloseDependencies, close } from './close'
import { depositBorrow } from './depositBorrow'
import {
  AaveGetCurrentPositionArgs,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
  AaveVersion,
  getCurrentPosition,
} from './getCurrentPosition'
import { open } from './open'
import { AaveOpenArgs, AaveV2OpenDependencies, AaveV3OpenDependencies } from './open/open'
import { openDepositAndBorrowDebt } from './openDepositAndBorrowDebt'
import { paybackWithdraw } from './paybackWithdraw'

export { AaveVersion } from './getCurrentPosition'

export const aave = {
  v2: {
    open: (args: AaveOpenArgs, dependencies: Omit<AaveV2OpenDependencies, 'protocol'>) =>
      open(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v2,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
    view: (
      args: AaveGetCurrentPositionArgs,
      dependencies: Omit<AaveV2GetCurrentPositionDependencies, 'protocolVersion'>,
    ) =>
      getCurrentPosition(args, {
        ...dependencies,
        protocolVersion: AaveVersion.v2,
      }),
    close: (args: AaveCloseArgs, dependencies: AaveCloseDependencies) =>
      close({ ...args, protocolVersion: AaveVersion.v2 }, dependencies),
    adjust: (args: AaveAdjustArgs, dependencies: Omit<AaveV2AdjustDependencies, 'protocol'>) =>
      adjust(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v2,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
    changeDebt,
    depositBorrow,
    paybackWithdraw,
    openDepositAndBorrowDebt,
  },
  v3: {
    open: (
      args: AaveOpenArgs,
      dependencies: Omit<AaveV3OpenDependencies, 'protocol' | 'protocolVersion'>,
    ) =>
      open(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v3,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
    close: (args: AaveCloseArgs, dependencies: AaveCloseDependencies) =>
      close({ ...args, protocolVersion: AaveVersion.v3 }, dependencies),
    adjust: (args: AaveAdjustArgs, dependencies: Omit<AaveV3AdjustDependencies, 'protocol'>) =>
      adjust(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v3,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
    view: (
      args: AaveGetCurrentPositionArgs,
      dependencies: Omit<AaveV3GetCurrentPositionDependencies, 'protocol' | 'protocolVersion'>,
    ) =>
      getCurrentPosition(args, {
        ...dependencies,
        protocolVersion: AaveVersion.v3,
      }),
  },
}
