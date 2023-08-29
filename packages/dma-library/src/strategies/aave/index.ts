import { getAaveProtocolData } from '@dma-library/protocols/aave/get-aave-protocol-data'
import { PositionTransition } from '@dma-library/types'
import { AaveVersion } from '@dma-library/types/aave'
import { views } from '@dma-library/views'

import { AaveV2ChangeDebt, changeDebt } from './borrow/change-debt'
import { AaveV2DepositBorrow, AaveV3DepositBorrow, depositBorrow } from './borrow/deposit-borrow'
import {
  AaveV2OpenDepositBorrow,
  AaveV3OpenDepositBorrow,
  openDepositBorrow,
} from './borrow/open-deposit-borrow'
import {
  AaveV2PaybackWithdraw,
  AaveV3PaybackWithdraw,
  paybackWithdraw,
} from './borrow/payback-withdraw'
import {
  AaveAdjustArgs,
  AaveV2AdjustDependencies,
  AaveV3AdjustDependencies,
  adjust,
} from './multiply/adjust'
import { AaveCloseArgs, AaveCloseDependencies, close } from './multiply/close'
import {
  AaveOpenArgs,
  AaveV2OpenDependencies,
  AaveV3OpenDependencies,
  open as aaveOpen,
} from './multiply/open'

export const aave: {
  borrow: {
    v2: {
      changeDebt: AaveV2ChangeDebt
      depositBorrow: AaveV2DepositBorrow
      openDepositBorrow: AaveV2OpenDepositBorrow
      paybackWithdraw: AaveV2PaybackWithdraw
    }
    v3: {
      depositBorrow: AaveV3DepositBorrow
      openDepositBorrow: AaveV3OpenDepositBorrow
      paybackWithdraw: AaveV3PaybackWithdraw
    }
  }
  multiply: {
    v2: {
      open: (
        args: AaveOpenArgs,
        dependencies: Omit<AaveV2OpenDependencies, 'protocol'>,
      ) => Promise<PositionTransition>
      close: (
        args: AaveCloseArgs,
        dependencies: AaveCloseDependencies,
      ) => Promise<PositionTransition>
      adjust: (
        args: AaveAdjustArgs,
        dependencies: Omit<AaveV2AdjustDependencies, 'protocol'>,
      ) => Promise<PositionTransition>
    }
    v3: {
      open: (
        args: AaveOpenArgs,
        dependencies: Omit<AaveV3OpenDependencies, 'protocol' | 'protocolVersion'>,
      ) => Promise<PositionTransition>
      close: (
        args: AaveCloseArgs,
        dependencies: AaveCloseDependencies,
      ) => Promise<PositionTransition>
      adjust: (
        args: AaveAdjustArgs,
        dependencies: Omit<AaveV3AdjustDependencies, 'protocol'>,
      ) => Promise<PositionTransition>
    }
  }
} = {
  borrow: {
    v2: {
      changeDebt,
      depositBorrow: (args, dependencies) =>
        depositBorrow(args, {
          ...dependencies,
          protocol: {
            version: AaveVersion.v2,
            getCurrentPosition: views.aave.v2,
            getProtocolData: getAaveProtocolData,
          },
        }),
      openDepositBorrow: (args, dependencies) =>
        openDepositBorrow(args, {
          ...dependencies,
          protocol: {
            version: AaveVersion.v2,
            getCurrentPosition: views.aave.v2,
            getProtocolData: getAaveProtocolData,
          },
        }),
      paybackWithdraw: (args, dependencies) =>
        paybackWithdraw(args, {
          ...dependencies,
          protocol: {
            version: AaveVersion.v2,
            getCurrentPosition: views.aave.v2,
            getProtocolData: getAaveProtocolData,
          },
        }),
    },
    v3: {
      depositBorrow: (args, dependencies) =>
        depositBorrow(args, {
          ...dependencies,
          protocol: {
            version: AaveVersion.v3,
            getCurrentPosition: views.aave.v3,
            getProtocolData: getAaveProtocolData,
          },
        }),
      openDepositBorrow: (args, dependencies) =>
        openDepositBorrow(args, {
          ...dependencies,
          protocol: {
            version: AaveVersion.v3,
            getCurrentPosition: views.aave.v3,
            getProtocolData: getAaveProtocolData,
          },
        }),
      paybackWithdraw: (args, dependencies) =>
        paybackWithdraw(args, {
          ...dependencies,
          protocol: {
            version: AaveVersion.v3,
            getCurrentPosition: views.aave.v3,
            getProtocolData: getAaveProtocolData,
          },
        }),
    },
  },
  multiply: {
    v2: {
      open: (args, dependencies) =>
        aaveOpen(args, {
          ...dependencies,
          protocol: {
            version: AaveVersion.v2,
            getCurrentPosition: views.aave.v2,
            getProtocolData: getAaveProtocolData,
          },
        }),
      close: (args, dependencies) =>
        close({ ...args, protocolVersion: AaveVersion.v2 }, dependencies),
      adjust: (args, dependencies) =>
        adjust(args, {
          ...dependencies,
          protocol: {
            version: AaveVersion.v2,
            getCurrentPosition: views.aave.v2,
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
            getCurrentPosition: views.aave.v3,
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
            getCurrentPosition: views.aave.v3,
            getProtocolData: getAaveProtocolData,
          },
        }),
    },
  },
}
