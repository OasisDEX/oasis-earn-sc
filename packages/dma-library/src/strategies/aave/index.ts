import { getAaveProtocolData } from '@dma-library/protocols/aave/get-aave-protocol-data'
import { MigrationFromEOAStrategy } from '@dma-library/strategies/aave-like'
import { AaveVersion } from '@dma-library/types/aave'
import { WithV2Protocol, WithV3Protocol } from '@dma-library/types/aave/protocol'
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
import { migrateAaveFromEOA } from './migrate/migrate-from-eoa'
import { AaveV2Adjust, AaveV3Adjust, adjust } from './multiply/adjust'
import { AaveV2Close, AaveV3Close, close } from './multiply/close'
import { AaveV2Open, AaveV3Open, open } from './multiply/open'

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
      open: AaveV2Open
      close: AaveV2Close
      adjust: AaveV2Adjust
    }
    v3: {
      open: AaveV3Open
      close: AaveV3Close
      adjust: AaveV3Adjust
    }
  }
  migrateFromEOA: MigrationFromEOAStrategy
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
  },
  migrateFromEOA: migrateAaveFromEOA,
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

function withV3Protocol<ArgsType, DependenciesType, ReturnType>(
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
