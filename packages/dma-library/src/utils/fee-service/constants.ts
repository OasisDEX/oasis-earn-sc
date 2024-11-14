import { OPERATION_NAMES } from '@deploy-configurations/constants'

export const AUM_FEE_RATE = 0.0002 // 0.02%

const cleanVersionSuffix = (operationName: string) => {
  // suffix could be _2 or _v2
  return operationName.replace(/(_\d+|_v\d+)$/, '')
}

export const supportedOpenEvents = [
  OPERATION_NAMES.aave.v2.OPEN_POSITION,
  OPERATION_NAMES.aave.v2.OPEN_DEPOSIT_BORROW,
  OPERATION_NAMES.aave.v3.OPEN_POSITION,
  OPERATION_NAMES.aave.v3.OPEN_DEPOSIT_BORROW,
  OPERATION_NAMES.spark.OPEN_POSITION,
  OPERATION_NAMES.spark.OPEN_DEPOSIT_BORROW,
  OPERATION_NAMES.ajna.OPEN_MULTIPLY_POSITION,
  OPERATION_NAMES.morphoblue.OPEN_DEPOSIT_BORROW,
  OPERATION_NAMES.morphoblue.OPEN_POSITION,
].map(cleanVersionSuffix)

export const supportedCloseEvents = [
  OPERATION_NAMES.aave.v2.CLOSE_POSITION,
  OPERATION_NAMES.aave.v3.CLOSE_POSITION,
  OPERATION_NAMES.spark.CLOSE_POSITION,
  OPERATION_NAMES.ajna.CLOSE_POSITION_TO_COLLATERAL,
  OPERATION_NAMES.ajna.CLOSE_POSITION_TO_QUOTE,
  OPERATION_NAMES.morphoblue.CLOSE_POSITION,
].map(cleanVersionSuffix)

export const supportedDeriskEvents = [
  OPERATION_NAMES.aave.v2.DECREASE_POSITION,
  OPERATION_NAMES.aave.v3.ADJUST_RISK_DOWN,
  OPERATION_NAMES.spark.ADJUST_RISK_DOWN,
  OPERATION_NAMES.ajna.ADJUST_RISK_DOWN,
  OPERATION_NAMES.morphoblue.ADJUST_RISK_DOWN,
].map(cleanVersionSuffix)

export const supportedWithdrawEvents = [
  OPERATION_NAMES.aave.v2.PAYBACK_WITHDRAW,
  OPERATION_NAMES.aave.v3.PAYBACK_WITHDRAW,
  OPERATION_NAMES.spark.PAYBACK_WITHDRAW,
  OPERATION_NAMES.ajna.PAYBACK_WITHDRAW,
  OPERATION_NAMES.morphoblue.PAYBACK_WITHDRAW,
].map(cleanVersionSuffix)
