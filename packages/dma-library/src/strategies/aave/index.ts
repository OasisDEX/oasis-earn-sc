import { AavePosition, PositionTransition } from '@dma-library/types'

import { getAaveProtocolData } from '../../protocols/aave/get-aave-protocol-data'
import { adjust } from './adjust'
import { AaveAdjustArgs, AaveV2AdjustDependencies, AaveV3AdjustDependencies } from './adjust/adjust'
import { AaveV2ChangeDebt, changeDebt } from './change-debt'
import { AaveCloseArgs, AaveCloseDependencies, close } from './close'
import { AaveV2DepositBorrow, depositBorrow } from './deposit-borrow'
import {
  AaveGetCurrentPositionArgs,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
  AaveVersion,
  getCurrentPosition,
} from './get-current-position'
import { open as aaveOpen } from './open'
import { AaveOpenArgs, AaveV2OpenDependencies, AaveV3OpenDependencies } from './open/open'
import {
  AaveV2OpenDepositAndBorrowDebt,
  openDepositAndBorrowDebt,
} from './open-deposit-and-borrow-debt'
import { AaveV2PaybackWithdraw, paybackWithdraw } from './payback-withdraw'

export { AaveVersion } from './get-current-position'

export const aave: {
  v2: {
    open: (
      args: AaveOpenArgs,
      dependencies: Omit<AaveV2OpenDependencies, 'protocol'>,
    ) => Promise<PositionTransition>
    view: (
      args: AaveGetCurrentPositionArgs,
      dependencies: Omit<AaveV2GetCurrentPositionDependencies, 'protocolVersion'>,
    ) => Promise<AavePosition>
    close: (args: AaveCloseArgs, dependencies: AaveCloseDependencies) => Promise<PositionTransition>
    adjust: (
      args: AaveAdjustArgs,
      dependencies: Omit<AaveV2AdjustDependencies, 'protocol'>,
    ) => Promise<PositionTransition>
    changeDebt: AaveV2ChangeDebt
    depositBorrow: AaveV2DepositBorrow
    paybackWithdraw: AaveV2PaybackWithdraw
    openDepositAndBorrowDebt: AaveV2OpenDepositAndBorrowDebt
  }
  v3: {
    open: (
      args: AaveOpenArgs,
      dependencies: Omit<AaveV3OpenDependencies, 'protocol' | 'protocolVersion'>,
    ) => Promise<PositionTransition>
    close: (args: AaveCloseArgs, dependencies: AaveCloseDependencies) => Promise<PositionTransition>
    adjust: (
      args: AaveAdjustArgs,
      dependencies: Omit<AaveV3AdjustDependencies, 'protocol'>,
    ) => Promise<PositionTransition>
    view: (
      args: AaveGetCurrentPositionArgs,
      dependencies: Omit<AaveV3GetCurrentPositionDependencies, 'protocol' | 'protocolVersion'>,
    ) => Promise<AavePosition>
  }
} = {
  v2: {
    open: (args, dependencies) =>
      aaveOpen(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v2,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
    view: (args, dependencies) =>
      getCurrentPosition(args, {
        ...dependencies,
        protocolVersion: AaveVersion.v2,
      }),
    close: (args, dependencies) =>
      close({ ...args, protocolVersion: AaveVersion.v2 }, dependencies),
    adjust: (args, dependencies) =>
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
    open: (args, dependencies) =>
      aaveOpen(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v3,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
    close: (args, dependencies) =>
      close({ ...args, protocolVersion: AaveVersion.v3 }, dependencies),
    adjust: (args, dependencies) =>
      adjust(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v3,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
    view: (args, dependencies) =>
      getCurrentPosition(args, {
        ...dependencies,
        protocolVersion: AaveVersion.v3,
      }),
  },
}
