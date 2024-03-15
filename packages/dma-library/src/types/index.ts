import { isProtocol, Protocol, ProtocolNames } from '@deploy-configurations/types/protocol'

import { ActionCall } from './action-call'
import { calldataTypes } from './actions'
import type { AjnaError, SummerStrategy } from './ajna'
import {
  AjnaBorrowPayload,
  AjnaCommonDependencies,
  AjnaCommonPayload,
  AjnaEarnPosition,
  AjnaMultiplyPayload,
  AjnaOpenEarnDependencies,
  AjnaOpenEarnPayload,
  AjnaOpenMultiplyPayload,
  AjnaPosition,
} from './ajna'
import type { Strategy } from './common'
import { FlashloanProvider } from './common'
import { MorphoBlueMarket, MorphoBluePosition } from './morphoblue'
import type {
  IOperation,
  WithAjnaBucketPrice,
  WithBorrowing,
  WithCollateral,
  WithCollateralAndWithdrawal,
  WithDebt,
  WithDebtAndBorrow,
  WithEMode,
  WithFlashloan,
  WithNetwork,
  WithOptionalDeposit,
  WithOptionalFlashloan,
  WithPosition,
  WithPositionAndLockedCollateral,
  WithProxy,
  WithSummerStrategyAddresses,
  WithSwap,
  WithWithdrawal,
} from './operations'
import type { PositionType } from './position-type'
import type { IMultiplyStrategy, IStrategy, Swap } from './strategies'
import type {
  IViewPositionParams,
  WithBorrowDebt,
  WithCollateralTokenAddress,
  WithDebtChange,
  WithDebtTokenAddress,
  WithDepositCollateral,
  WithFlashLoanArgs,
  WithPaybackDebt,
  WithPositionType,
  WithViewPositionDependencies,
  WithWithdrawCollateral,
} from './strategy-params'
import type { SwapData } from './swap-data'

export type { IMultiplyStrategy, IStrategy }
export type { CommonDMADependencies } from './common'
export { FlashloanProvider }
export type { AjnaError, Strategy, SummerStrategy }
export { AjnaEarnPosition, AjnaPosition }

export type {
  AjnaBorrowPayload,
  AjnaCommonDependencies,
  AjnaCommonPayload,
  AjnaMultiplyPayload,
  AjnaOpenEarnDependencies,
  AjnaOpenEarnPayload,
  AjnaOpenMultiplyPayload,
}

export {
  AaveLikePosition,
  AaveLikePositionV2,
  AaveLikeProtocolEnum,
  AaveLikeTokens,
} from './aave-like'

export { ActionCall }
export { calldataTypes }

export type {
  IOperation,
  WithAjnaBucketPrice,
  WithBorrowing,
  WithCollateral,
  WithCollateralAndWithdrawal,
  WithDebt,
  WithDebtAndBorrow,
  WithEMode,
  WithFlashloan,
  WithNetwork,
  WithOptionalDeposit,
  WithOptionalFlashloan,
  WithPosition,
  WithPositionAndLockedCollateral,
  WithProxy,
  WithSummerStrategyAddresses,
  WithSwap,
  WithWithdrawal,
}

export type { PositionType }
export type { Protocol }
export { isProtocol, ProtocolNames }
export type {
  IViewPositionParams,
  WithBorrowDebt,
  WithCollateralTokenAddress,
  WithDebtChange,
  WithDebtTokenAddress,
  WithDepositCollateral,
  WithFlashLoanArgs,
  WithPaybackDebt,
  WithPositionType,
  WithViewPositionDependencies,
  WithWithdrawCollateral,
}
export type { SwapData }
export type { Swap }

export { MorphoBluePosition }
export type { MorphoBlueMarket }

export type {
  Erc4626CommonDependencies,
  Erc4626DepositPayload,
  Erc4626DepositStrategy,
  Erc4626StrategyAddresses,
  Erc4626WithdrawPayload,
  Erc4626WithdrawStrategy,
  IErc4626Position,
} from './common'
export { Erc4626Position, FeeType } from './common'
export type {
  EarnCumulativesData,
  EarnCumulativesRawData,
  LendingCumulativesData,
  LendingCumulativesRawData,
} from './cumulatives'
