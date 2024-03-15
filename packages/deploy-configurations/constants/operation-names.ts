import { Protocol } from '@deploy-configurations/types/protocol'

export type AaveV3OperationNames =
  | 'OpenAAVEV3Position_v2'
  | 'CloseAAVEV3Position_v4'
  | 'AdjustRiskUpAAVEV3Position_v2'
  | 'AdjustRiskDownAAVEV3Position_v2'
  | 'AAVEV3DepositBorrow_v2'
  | 'AAVEV3OpenDepositBorrow_v2'
  | 'AAVEV3Deposit'
  | 'AAVEV3Borrow_v2'
  | 'AAVEV3PaybackWithdraw_v2'
  | 'MigrateAaveV3EOA_v2'

export type SparkOperationNames =
  | 'SparkOpenPosition_v2'
  | 'SparkClosePosition_v2'
  | 'SparkAdjustRiskUp_v2'
  | 'SparkAdjustRiskDown_v2'
  | 'SparkDepositBorrow_v2'
  | 'SparkOpenDepositBorrow_v2'
  | 'SparkDeposit'
  | 'SparkBorrow_v2'
  | 'SparkPaybackWithdraw_v2'
  | 'MigrateSparkEOA_v2'

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
      OPEN_POSITION: 'OpenAAVEV3Position_v2',
      CLOSE_POSITION: 'CloseAAVEV3Position_v4',
      ADJUST_RISK_UP: 'AdjustRiskUpAAVEV3Position_v2',
      ADJUST_RISK_DOWN: 'AdjustRiskDownAAVEV3Position_v2',
      DEPOSIT_BORROW: 'AAVEV3DepositBorrow_v2',
      OPEN_DEPOSIT_BORROW: 'AAVEV3OpenDepositBorrow_v2',
      DEPOSIT: 'AAVEV3Deposit',
      BORROW: 'AAVEV3Borrow_v2',
      PAYBACK_WITHDRAW: 'AAVEV3PaybackWithdraw_v2',
      MIGRATE_EOA: 'MigrateAaveV3EOA_v2',
    },
  },
  spark: {
    OPEN_POSITION: 'SparkOpenPosition_v2',
    CLOSE_POSITION: 'SparkClosePosition_v2',
    ADJUST_RISK_UP: 'SparkAdjustRiskUp_v2',
    ADJUST_RISK_DOWN: 'SparkAdjustRiskDown_v2',
    DEPOSIT_BORROW: 'SparkDepositBorrow_v2',
    OPEN_DEPOSIT_BORROW: 'SparkOpenDepositBorrow_v2',
    DEPOSIT: 'SparkDeposit',
    BORROW: 'SparkBorrow_v2',
    PAYBACK_WITHDRAW: 'SparkPaybackWithdraw_v2',
    MIGRATE_EOA: 'MigrateSparkEOA_v2',
  },
  maker: {
    OPEN_AND_DRAW: 'OpenAndDraw',
    OPEN_DRAW_AND_CLOSE: 'OpenDrawAndClose',
    INCREASE_MULTIPLE: 'IncreaseMultiple',
    INCREASE_MULTIPLE_WITH_DAI_TOP_UP: 'IncreaseMultipleWithDaiTopup',
    INCREASE_MULTIPLE_WITH_COLL_TOP_UP: 'IncreaseMultipleWithCollateralTopup',
    INCREASE_MULTIPLE_WITH_DAI_AND_COLL_TOP_UP: 'IncreaseMultipleWithDaiAndCollTopup',
    INCREASE_MULTIPLE_WITH_FLASHLOAN: 'IncreaseMultipleWithFlashloan',
    INCREASE_MULTIPLE_WITH_FLASHLOAN_AND_DAI_AND_COLL_TOP_UP:
      'IncreaseMultipleWithFlashloanWithDaiAndCollTopup',
  },
  ajna: {
    OPEN_MULTIPLY_POSITION: 'AjnaOpenMultiplyPosition_5',
    ADJUST_RISK_UP: 'AjnaAdjustRiskUp_5',
    ADJUST_RISK_DOWN: 'AjnaAdjustRiskDown_5',
    DEPOSIT_BORROW: 'AjnaDepositBorrow_5',
    PAYBACK_WITHDRAW: 'AjnaPaybackWithdraw_5',
    CLOSE_POSITION_TO_QUOTE: 'AjnaCloseToQuotePosition_5',
    CLOSE_POSITION_TO_COLLATERAL: 'AjnaCloseToCollateralPosition_5',
  },
  morphoblue: {
    OPEN_POSITION: 'MorphoBlueOpenPosition',
    CLOSE_POSITION: 'MorphoBlueClosePosition_2',
    ADJUST_RISK_UP: 'MorphoBlueAdjustRiskUp',
    ADJUST_RISK_DOWN: 'MorphoBlueAdjustRiskDown_2',
    DEPOSIT_BORROW: 'MorphoBlueDepositBorrow',
    OPEN_DEPOSIT_BORROW: 'MorphoBlueOpenDepositBorrow',
    DEPOSIT: 'MorphoBlueDeposit',
    BORROW: 'MorphoBlueBorrow',
    PAYBACK_WITHDRAW: 'MorphoBluePaybackWithdraw_2',
    CLAIM_REWARDS: 'MorphoBlueClaimRewards',
  },
  common: {
    CUSTOM_OPERATION: 'CustomOperation',
    ERC4626_DEPOSIT: 'ERC4626Deposit',
    ERC4626_WITHDRAW: 'ERC4626Withdraw',
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
