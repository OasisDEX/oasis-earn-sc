export type AaveV2Actions = 'AaveBorrow' | 'AaveDeposit' | 'AaveWithdraw' | `AavePayback`

export type AaveV3Actions =
  | `AaveV3Borrow`
  | `AaveV3Deposit`
  | `AaveV3Withdraw`
  | `AaveV3Payback`
  | `AaveV3SetEMode`

export type CommonActions =
  | 'SwapAction'
  | 'PullToken'
  | 'PullTokenMaxAmount'
  | 'SendToken'
  | 'SetApproval'
  | 'WrapEth'
  | 'UnwrapEth'
  | 'TakeFlashloan'
  | 'ReturnFunds'
  | 'ReturnMultipleTokens'
  | 'PositionCreated'
  | 'TokenBalance'
  | 'ERC4626Deposit'
  | 'ERC4626Withdraw'

export type AjnaActions = 'AjnaDepositBorrow' | 'AjnaRepayWithdraw'

export type SparkActions =
  | `SparkBorrow`
  | `SparkDeposit`
  | `SparkWithdraw`
  | `SparkPayback`
  | `SparkSetEMode`

export type MorphoBlueActions =
  | `MorphoBlueBorrow`
  | `MorphoBlueDeposit`
  | `MorphoBlueWithdraw`
  | `MorphoBluePayback`
  | 'MorphoBlueClaimRewards'

export type Actions = CommonActions | AaveV3Actions | AjnaActions

import { SystemConfigEntry } from './config-entries'

export type OptionalSparkContracts = Partial<Record<SparkActions, SystemConfigEntry>>
export type OptionalAaveV2Contracts = Partial<Record<AaveV2Actions, SystemConfigEntry>>
export type OptionalMorphoBlueContracts = Partial<Record<MorphoBlueActions, SystemConfigEntry>>
export type ActionContracts = Record<Actions, SystemConfigEntry>
