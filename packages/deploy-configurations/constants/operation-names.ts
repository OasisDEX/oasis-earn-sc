import { Protocol } from '@deploy-configurations/types/protocol'

export type AaveV3OperationNames =
  | 'OpenAAVEV3Position_v3'
  | 'CloseAAVEV3Position_v5'
  | 'AdjustRiskUpAAVEV3Position_v3'
  | 'AdjustRiskDownAAVEV3Position_v3'
  | 'AAVEV3DepositBorrow_v3'
  | 'AAVEV3OpenDepositBorrow_v3'
  | 'AAVEV3Deposit_v2'
  | 'AAVEV3Borrow_v3'
  | 'AAVEV3PaybackWithdraw_v3'
  | 'MigrateAaveV3EOA_v3'

export type SparkOperationNames =
  | 'SparkOpenPosition_v3'
  | 'SparkClosePosition_v3'
  | 'SparkAdjustRiskUp_v3'
  | 'SparkAdjustRiskDown_v3'
  | 'SparkDepositBorrow_v3'
  | 'SparkOpenDepositBorrow_v3'
  | 'SparkDeposit_v2'
  | 'SparkBorrow_v3'
  | 'SparkPaybackWithdraw_v3'
  | 'MigrateSparkEOA_v3'

export const OPERATION_NAMES = {
  aave: {
    v2: {
      OPEN_POSITION: 'OpenAAVEPosition',
      CLOSE_POSITION: 'CloseAAVEPosition_3',
      INCREASE_POSITION: 'IncreaseAAVEPosition',
      DECREASE_POSITION: 'DecreaseAAVEPosition',
      DEPOSIT_BORROW: 'AAVEDepositBorrow',
      OPEN_DEPOSIT_BORROW: 'AAVEOpenDepositBorrow',
      DEPOSIT: 'AAVEDeposit',
      BORROW: 'AAVEBorrow',
      PAYBACK_WITHDRAW: 'AAVEPaybackWithdraw_2',
    },
    v3: {
      OPEN_POSITION: 'OpenAAVEV3Position_v3',
      CLOSE_POSITION: 'CloseAAVEV3Position_v5',
      ADJUST_RISK_UP: 'AdjustRiskUpAAVEV3Position_v3',
      ADJUST_RISK_DOWN: 'AdjustRiskDownAAVEV3Position_v3',
      DEPOSIT_BORROW: 'AAVEV3DepositBorrow_v3',
      OPEN_DEPOSIT_BORROW: 'AAVEV3OpenDepositBorrow_v3',
      DEPOSIT: 'AAVEV3Deposit_v2',
      BORROW: 'AAVEV3Borrow_v3',
      PAYBACK_WITHDRAW: 'AAVEV3PaybackWithdraw_v3',
      MIGRATE_EOA: 'MigrateAaveV3EOA_v3',
    },
  },
  spark: {
    OPEN_POSITION: 'SparkOpenPosition_v3',
    CLOSE_POSITION: 'SparkClosePosition_v3',
    ADJUST_RISK_UP: 'SparkAdjustRiskUp_v3',
    ADJUST_RISK_DOWN: 'SparkAdjustRiskDown_v3',
    DEPOSIT_BORROW: 'SparkDepositBorrow_v3',
    OPEN_DEPOSIT_BORROW: 'SparkOpenDepositBorrow_v3',
    DEPOSIT: 'SparkDeposit_v2',
    BORROW: 'SparkBorrow_v3',
    PAYBACK_WITHDRAW: 'SparkPaybackWithdraw_v3',
    MIGRATE_EOA: 'MigrateSparkEOA_v3',
  },
  maker: {
    OPEN_AND_DRAW: 'OpenAndDraw_v2',
    OPEN_DRAW_AND_CLOSE: 'OpenDrawAndClose_v2',
    INCREASE_MULTIPLE: 'IncreaseMultiple_v2',
    INCREASE_MULTIPLE_WITH_DAI_TOP_UP: 'IncreaseMultipleWithDaiTopup_v2',
    INCREASE_MULTIPLE_WITH_COLL_TOP_UP: 'IncreaseMultipleWithCollateralTopup_v2',
    INCREASE_MULTIPLE_WITH_DAI_AND_COLL_TOP_UP: 'IncreaseMultipleWithDaiAndCollTopup_v2',
    INCREASE_MULTIPLE_WITH_FLASHLOAN: 'IncreaseMultipleWithFlashloan_v2',
    INCREASE_MULTIPLE_WITH_FLASHLOAN_AND_DAI_AND_COLL_TOP_UP:
      'IncreaseMultipleWithFlashloanWithDaiAndCollTopup_v2',
  },
  ajna: {
    OPEN_MULTIPLY_POSITION: 'AjnaOpenMultiplyPosition_6',
    ADJUST_RISK_UP: 'AjnaAdjustRiskUp_6',
    ADJUST_RISK_DOWN: 'AjnaAdjustRiskDown_6',
    DEPOSIT_BORROW: 'AjnaDepositBorrow_6',
    PAYBACK_WITHDRAW: 'AjnaPaybackWithdraw_6',
    CLOSE_POSITION_TO_QUOTE: 'AjnaCloseToQuotePosition_6',
    CLOSE_POSITION_TO_COLLATERAL: 'AjnaCloseToCollateralPosition_6',
  },
  morphoblue: {
    OPEN_POSITION: 'MorphoBlueOpenPosition_2',
    CLOSE_POSITION: 'MorphoBlueClosePosition_3',
    ADJUST_RISK_UP: 'MorphoBlueAdjustRiskUp_2',
    ADJUST_RISK_DOWN: 'MorphoBlueAdjustRiskDown_3',
    DEPOSIT_BORROW: 'MorphoBlueDepositBorrow_2',
    OPEN_DEPOSIT_BORROW: 'MorphoBlueOpenDepositBorrow_2',
    DEPOSIT: 'MorphoBlueDeposit_2',
    BORROW: 'MorphoBlueBorrow_2',
    PAYBACK_WITHDRAW: 'MorphoBluePaybackWithdraw_3',
    CLAIM_REWARDS: 'MorphoBlueClaimRewards_2',
  },
  common: {
    CUSTOM_OPERATION: 'CustomOperation_2',
    ERC4626_DEPOSIT: 'ERC4626Deposit_2',
    ERC4626_WITHDRAW: 'ERC4626Withdraw_2',
  },
} as const

type ValuesOf<T> = T[keyof T]
type AaveV2OperationsNames = ValuesOf<(typeof OPERATION_NAMES)['aave']['v2']>
type AaveV3OperationsNames = ValuesOf<(typeof OPERATION_NAMES)['aave']['v3']>
type MakerOperationsNames = ValuesOf<(typeof OPERATION_NAMES)['maker']>
type AjnaOperationsNames = ValuesOf<(typeof OPERATION_NAMES)['ajna']>
type SparkOperationsNames = ValuesOf<(typeof OPERATION_NAMES)['spark']>
type MorphoBlueOperationsNames = ValuesOf<(typeof OPERATION_NAMES)['morphoblue']>
type CommonOperationsNames = ValuesOf<(typeof OPERATION_NAMES)['common']>

/**
 * Refinance operations names
 *
 * @dev This type is used to generate the names of the refinance operations. It uses template
 * literal types from Typescript 4.1 to generate the names
 *
 * @dev The `Protocol` type from `@dma-library` is redefined here to avoid dependencies issues.
 * The type should actually be moved here and
 */
export type RefinanceOperationsNames = `Refinance-${Protocol}-${Protocol}`

export type OperationNames =
  | CommonOperationsNames
  | AaveV2OperationsNames
  | AaveV3OperationsNames
  | MakerOperationsNames
  | AjnaOperationsNames
  | SparkOperationsNames
  | MorphoBlueOperationsNames
  | RefinanceOperationsNames
