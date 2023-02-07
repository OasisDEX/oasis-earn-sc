import { getAaveProtocolData } from '../../protocols/aave/getAaveProtocolData'
import { adjust } from './adjust'
import { changeDebt } from './changeDebt'
import { close } from './close'
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
    view: (args: AaveGetCurrentPositionArgs, dependencies: AaveV2GetCurrentPositionDependencies) =>
      getCurrentPosition(args, {
        ...dependencies,
        protocolVersion: AaveVersion.v2,
      }),
    close: close,
    adjust: adjust,
    changeDebt: changeDebt,
    depositBorrow,
    paybackWithdraw: paybackWithdraw,
    openDepositAndBorrowDebt: openDepositAndBorrowDebt,
  },
  v3: {
    open: (args: AaveOpenArgs, dependencies: Omit<AaveV3OpenDependencies, 'protocol'>) =>
      open(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v3,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
    view: (args: AaveGetCurrentPositionArgs, dependencies: AaveV3GetCurrentPositionDependencies) =>
      getCurrentPosition(args, {
        ...dependencies,
        protocolVersion: AaveVersion.v3,
      }),
  },
}
