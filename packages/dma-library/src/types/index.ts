import { ActionCall } from './action-call'
import { calldataTypes } from './actions'
import type { AjnaError, AjnaStrategy } from './ajna'
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
  WithAjnaStrategyAddresses,
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
  WithSwap,
  WithWithdrawal,
} from './operations'
import type { PositionType } from './position-type'
import type { Protocol } from './protocol'
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
export type { AjnaError, AjnaStrategy, Strategy }
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

export { AaveLikePosition, AaveLikeTokens } from './aave-like'

export { ActionCall }
export { calldataTypes }

export type {
  IOperation,
  WithAjnaBucketPrice,
  WithAjnaStrategyAddresses,
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
  WithSwap,
  WithWithdrawal,
}

export type { PositionType }
export type { Protocol }
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
