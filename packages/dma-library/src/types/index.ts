import type { AAVETokens } from './aave'
import { AavePosition } from './aave'
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
import type {
  IOperation,
  WithAaveV2StrategyAddresses,
  WithAaveV3StrategyAddresses,
  WithAjnaBucketPrice,
  WithAjnaStrategyAddresses,
  WithBorrowing,
  WithCollateral,
  WithCollateralAndWithdrawal,
  WithDebt,
  WithDebtAndBorrow,
  WithDeposit,
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
import type {
  ISimplePositionTransition,
  ISimpleSimulatedTransition,
  ISimulatedTransition,
  PositionTransition,
} from './strategies'
import type {
  IBasePositionTransitionArgs,
  IOnlyDepositBorrowOpenPositionTransitionDependencies,
  IOpenPositionTransitionDependencies,
  IPositionTransitionArgs,
  IPositionTransitionDependencies,
  IViewPositionDependencies,
  IViewPositionParams,
  WithBorrowDebt,
  WithCollateralTokenAddress,
  WithDebtChange,
  WithDebtTokenAddress,
  WithDepositCollateral,
  WithFlashloanToken,
  WithPaybackDebt,
  WithPositionType,
  WithWithdrawCollateral,
} from './strategy-params'
import type { SwapData } from './swap-data'

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

export type { AAVETokens }
export { AavePosition }

export { ActionCall }
export { calldataTypes }

export type {
  IOperation,
  WithAaveV2StrategyAddresses,
  WithAaveV3StrategyAddresses,
  WithAjnaBucketPrice,
  WithAjnaStrategyAddresses,
  WithBorrowing,
  WithCollateral,
  WithCollateralAndWithdrawal,
  WithDebt,
  WithDebtAndBorrow,
  WithDeposit,
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

export type {
  ISimplePositionTransition,
  ISimpleSimulatedTransition,
  ISimulatedTransition,
  PositionTransition,
}
export type { PositionType }
export type { Protocol }
export type {
  IBasePositionTransitionArgs,
  IOnlyDepositBorrowOpenPositionTransitionDependencies,
  IOpenPositionTransitionDependencies,
  IPositionTransitionArgs,
  IPositionTransitionDependencies,
  IViewPositionDependencies,
  IViewPositionParams,
  WithBorrowDebt,
  WithCollateralTokenAddress,
  WithDebtChange,
  WithDebtTokenAddress,
  WithDepositCollateral,
  WithFlashloanToken,
  WithPaybackDebt,
  WithPositionType,
  WithWithdrawCollateral,
}
export type { SwapData }
