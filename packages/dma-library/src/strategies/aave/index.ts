import { getAaveProtocolData } from '@dma-library/protocols/aave/get-aave-protocol-data'
import { AaveDepositBorrowActionOmni } from '@dma-library/strategies/aave/borrow/deposit-borrow/types'
import { depositBorrowOmni } from '@dma-library/strategies/aave/omni/borrow/deposit-borrow'
import { openDepositBorrowOmni } from '@dma-library/strategies/aave/omni/borrow/open-deposit-borrow'
import { paybackWithdrawOmni } from '@dma-library/strategies/aave/omni/borrow/payback-withdraw'
import { adjustOmni } from '@dma-library/strategies/aave/omni/multiply/adjust'
import { closeOmni } from '@dma-library/strategies/aave/omni/multiply/close'
import { openOmni } from '@dma-library/strategies/aave/omni/multiply/open'
import { AaveVersion } from '@dma-library/types/aave'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
import { views } from '@dma-library/views'

import { MigrationStrategy } from '../aave-like'
import { migrate } from '../common/migrate'
import { AaveV2ChangeDebt, changeDebt } from './borrow/change-debt'
import { AaveV2DepositBorrow, AaveV3DepositBorrow, depositBorrow } from './borrow/deposit-borrow'
import {
  AaveOpenDepositBorrowActionOmni,
  AaveV2OpenDepositBorrow,
  AaveV3OpenDepositBorrow,
  openDepositBorrow,
} from './borrow/open-deposit-borrow'
import {
  AavePaybackWithdrawActionOmni,
  AaveV2PaybackWithdraw,
  AaveV3PaybackWithdraw,
  paybackWithdraw,
} from './borrow/payback-withdraw'
import { AaveAdjustActionOmni, AaveV2Adjust, AaveV3Adjust, adjust } from './multiply/adjust'
import { AaveCloseActionOmni, AaveV2Close, AaveV3Close, close } from './multiply/close'
import { AaveOpenActionOmni, AaveV2Open, AaveV3Open, open } from './multiply/open'

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
    omni: {
      v2: {
        depositBorrow: AaveDepositBorrowActionOmni
        openDepositBorrow: AaveOpenDepositBorrowActionOmni
        paybackWithdraw: AavePaybackWithdrawActionOmni
      }
      v3: {
        depositBorrow: AaveDepositBorrowActionOmni
        openDepositBorrow: AaveOpenDepositBorrowActionOmni
        paybackWithdraw: AavePaybackWithdrawActionOmni
      }
    }
  }
  multiply: {
    v2: {
      open: AaveV2Open
      close: AaveV2Close
      adjust: AaveV2Adjust
    }
    v3: {
      open: AaveV3Open
      close: AaveV3Close
      adjust: AaveV3Adjust
    }
    omni: {
      v2: {
        open: AaveOpenActionOmni
        close: AaveCloseActionOmni
        adjust: AaveAdjustActionOmni
      }
      v3: {
        open: AaveOpenActionOmni
        adjust: AaveAdjustActionOmni
        close: AaveCloseActionOmni
      }
    }
  }
  migrate: {
    fromEOA: MigrationStrategy
  }
} = {
  borrow: {
    v2: {
      changeDebt,
      depositBorrow: (args, dependencies) => withV2Protocol(depositBorrow, args, dependencies),
      openDepositBorrow: (args, dependencies) =>
        withV2Protocol(openDepositBorrow, args, dependencies),
      paybackWithdraw: (args, dependencies) => withV2Protocol(paybackWithdraw, args, dependencies),
    },
    v3: {
      depositBorrow: (args, dependencies) => withV3Protocol(depositBorrow, args, dependencies),
      openDepositBorrow: (args, dependencies) =>
        withV3Protocol(openDepositBorrow, args, dependencies),
      paybackWithdraw: (args, dependencies) => withV3Protocol(paybackWithdraw, args, dependencies),
    },
    omni: {
      v2: {
        depositBorrow: (args, dependencies) =>
          withV2Protocol(depositBorrowOmni, args, dependencies),
        openDepositBorrow: (args, dependencies) =>
          withV2Protocol(openDepositBorrowOmni, args, dependencies),
        paybackWithdraw: (args, dependencies) =>
          withV2Protocol(paybackWithdrawOmni, args, dependencies),
      },
      v3: {
        depositBorrow: (args, dependencies) =>
          withV3Protocol(depositBorrowOmni, args, dependencies),
        openDepositBorrow: (args, dependencies) =>
          withV3Protocol(openDepositBorrowOmni, args, dependencies),
        paybackWithdraw: (args, dependencies) =>
          withV3Protocol(paybackWithdrawOmni, args, dependencies),
      },
    },
  },
  multiply: {
    v2: {
      open: (args, dependencies) => withV2Protocol(open, args, dependencies),
      close: (args, dependencies) => withV2Protocol(close, args, dependencies),
      adjust: (args, dependencies) => withV2Protocol(adjust, args, dependencies),
    },
    v3: {
      open: (args, dependencies) => withV3Protocol(open, args, dependencies),
      close: (args, dependencies) => withV3Protocol(close, args, dependencies),
      adjust: (args, dependencies) => withV3Protocol(adjust, args, dependencies),
    },
    omni: {
      v2: {
        open: (args, dependencies) => withV2Protocol(openOmni, args, dependencies),
        close: (args, dependencies) => withV2Protocol(closeOmni, args, dependencies),
        adjust: (args, dependencies) => withV2Protocol(adjustOmni, args, dependencies),
      },
      v3: {
        open: (args, dependencies) => withV3Protocol(openOmni, args, dependencies),
        close: (args, dependencies) => withV3Protocol(closeOmni, args, dependencies),
        adjust: (args, dependencies) => withV3Protocol(adjustOmni, args, dependencies),
      },
    },
  },
  migrate: {
    fromEOA: migrate,
  },
}

type DepsWithV2Protocol<T> = T & WithV2Protocol
type DepsWithV3Protocol<T> = T & WithV3Protocol

function withV2Protocol<ArgsType, DependenciesType, ReturnType>(
  fn: (args: ArgsType, dependencies: DepsWithV2Protocol<DependenciesType>) => ReturnType,
  args: ArgsType,
  dependencies: DependenciesType,
) {
  return fn(args, {
    ...dependencies,
    protocol: {
      version: AaveVersion.v2,
      getCurrentPosition: views.aave.v2,
      getProtocolData: getAaveProtocolData,
    },
  })
}

export function withV3Protocol<ArgsType, DependenciesType, ReturnType>(
  fn: (args: ArgsType, dependencies: DepsWithV3Protocol<DependenciesType>) => ReturnType,
  args: ArgsType,
  dependencies: DependenciesType,
) {
  return fn(args, {
    ...dependencies,
    protocol: {
      version: AaveVersion.v3,
      getCurrentPosition: views.aave.v3,
      getProtocolData: getAaveProtocolData,
    },
  })
}
