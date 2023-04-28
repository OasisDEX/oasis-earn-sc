import type { AAVETokens } from './aave'
import { AavePosition } from './aave'
import { ActionCall } from './action-call'
import { calldataTypes } from './actions'
import { AjnaEarnPosition, AjnaPosition } from './ajna'
import type { AjnaError, FlashloanProvider, Strategy } from './common'
import type {
  IOperation,
  WithAaveV2StrategyAddresses,
  WithAaveV3StrategyAddresses,
  WithBorrowing,
  WithCollateral,
  WithCollateralAndWithdrawal,
  WithDebt,
  WithDebtAndBorrow,
  WithDeposit,
  WithEMode,
  WithFlashloan,
  WithOptionalDeposit,
  WithOptionalFlashloan,
  WithPosition,
  WithPositionAndLockedCollateral,
  WithProxy,
  WithSwap,
  WithWithdrawal,
} from './operations'
import type {
  ISimplePositionTransition,
  ISimpleSimulatedTransition,
  ISimulatedTransition,
  PositionTransition,
} from './position-transition'
import type { PositionType } from './position-type'
import type { Protocol } from './protocol'
import type {
  IBasePositionTransitionArgs,
  IOnlyDepositBorrowOpenPositionTransitionDependencies,
  IOpenPositionTransitionDependencies,
  IPositionTransitionArgs,
  IPositionTransitionDependencies,
  IViewPositionDependencies,
  IViewPositionParams,
  WithBorrowDebt,
  WithDebtChange,
  WithDepositCollateral,
  WithLockedCollateral,
  WithPaybackDebt,
  WithPositionType,
  WithWithdrawCollateral,
} from './strategy-params'
import type { SwapData } from './swap-data'

export type { AjnaError, FlashloanProvider, Strategy }
export { AjnaEarnPosition, AjnaPosition }

export type { AAVETokens }
export { AavePosition }

export { ActionCall }
export { calldataTypes }

export type {
  IOperation,
  WithAaveV2StrategyAddresses,
  WithAaveV3StrategyAddresses,
  WithBorrowing,
  WithCollateral,
  WithCollateralAndWithdrawal,
  WithDebt,
  WithDebtAndBorrow,
  WithDeposit,
  WithEMode,
  WithFlashloan,
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
  WithDebtChange,
  WithDepositCollateral,
  WithLockedCollateral,
  WithPaybackDebt,
  WithPositionType,
  WithWithdrawCollateral,
}
export type { SwapData }
