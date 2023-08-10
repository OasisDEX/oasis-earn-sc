import { getAaveProtocolData } from '@dma-library/protocols/aave/get-aave-protocol-data'
import {
  AaveV2OpenDepositBorrow,
  AaveV3OpenDepositBorrow,
  openDepositBorrow,
} from '@dma-library/strategies/aave/open-deposit-borrow'
import { AavePosition, PositionTransition } from '@dma-library/types'

import {
  AaveAdjustArgs,
  AaveV2AdjustDependencies,
  AaveV3AdjustDependencies,
  adjust,
} from './adjust'
import { AaveV2ChangeDebt, changeDebt } from './change-debt'
import { AaveCloseArgs, AaveCloseDependencies, close } from './close'
import { AaveV2DepositBorrow, AaveV3DepositBorrow, depositBorrow } from './deposit-borrow'
import {
  AaveGetCurrentPositionArgs,
  AaveV2GetCurrentPositionDependencies,
  AaveV3GetCurrentPositionDependencies,
  AaveVersion,
  getCurrentPosition,
} from './get-current-position'
import { open as aaveOpen } from './open'
import { AaveOpenArgs, AaveV2OpenDependencies, AaveV3OpenDependencies } from './open/open'
import { AaveV2PaybackWithdraw, AaveV3PaybackWithdraw, paybackWithdraw } from './payback-withdraw'

export { getAaveTokenAddress } from './get-aave-token-addresses'
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
    openDepositAndBorrowDebt: AaveV2OpenDepositBorrow
    paybackWithdraw: AaveV2PaybackWithdraw
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
    depositBorrow: AaveV3DepositBorrow
    openDepositBorrow: AaveV3OpenDepositBorrow
    paybackWithdraw: AaveV3PaybackWithdraw
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
    depositBorrow: (args, dependencies) =>
      depositBorrow(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v2,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
    openDepositAndBorrowDebt: (args, dependencies) =>
      openDepositBorrow(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v2,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
    paybackWithdraw: (args, dependencies) =>
      paybackWithdraw(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v2,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
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
    depositBorrow: (args, dependencies) =>
      depositBorrow(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v3,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
    openDepositBorrow: (args, dependencies) =>
      openDepositBorrow(args, {
        ...dependencies,
        protocol: {
          version: AaveVersion.v3,
          getCurrentPosition,
          getProtocolData: getAaveProtocolData,
        },
      }),
    paybackWithdraw: (args, dependencies) =>
      paybackWithdraw(args, {
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
