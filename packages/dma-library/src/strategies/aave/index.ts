import { getAaveProtocolData } from '@dma-library/protocols/aave/get-aave-protocol-data'
import { AavePosition, PositionTransition } from '@dma-library/types'
import { IStrategy } from '@dma-library/types/position-transition'

import { adjust } from './adjust'
import { AaveAdjustArgs, AaveV2AdjustDependencies, AaveV3AdjustDependencies } from './adjust/adjust'
import { changeDebt } from './change-debt'
import { AaveCloseArgs, AaveCloseDependencies, close } from './close'
import { depositBorrow } from './deposit-borrow'
import {
  AaveGetCurrentPositionArgs,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
  AaveVersion,
  getCurrentPosition,
} from './get-current-position'
import { open } from './open'
import { AaveOpenArgs, AaveV2OpenDependencies, AaveV3OpenDependencies } from './open/open'
import { openDepositAndBorrowDebt } from './open-deposit-and-borrow-debt'
import {
  AavePaybackWithdrawArgs,
  AaveV2PaybackWithdrawDependencies,
  AaveV3PaybackWithdrawDependencies,
  paybackWithdraw,
} from './payback-withdraw'

export { AaveVersion } from './get-current-position'

export const aave = {
  v2: {
    open: (
      args: AaveOpenArgs,
      dependencies: Omit<AaveV2OpenDependencies, 'protocol'>,
    ): Promise<PositionTransition> =>
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
    ): Promise<AavePosition> =>
      getCurrentPosition(args, {
        ...dependencies,
        protocolVersion: AaveVersion.v2,
      }),
    close: (
      args: AaveCloseArgs,
      dependencies: AaveCloseDependencies,
    ): Promise<PositionTransition> =>
      close({ ...args, protocolVersion: AaveVersion.v2 }, dependencies),
    adjust: (
      args: AaveAdjustArgs,
      dependencies: Omit<AaveV2AdjustDependencies, 'protocol'>,
    ): Promise<PositionTransition> =>
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
    paybackWithdraw: (
      args: AavePaybackWithdrawArgs,
      dependencies: AaveV2PaybackWithdrawDependencies,
    ): Promise<IStrategy> =>
      paybackWithdraw(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v2,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
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
    paybackWithdraw: (
      args: AavePaybackWithdrawArgs,
      dependencies: AaveV3PaybackWithdrawDependencies,
    ): Promise<IStrategy> =>
      paybackWithdraw(args, {
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
