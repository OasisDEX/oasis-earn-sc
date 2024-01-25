import { Protocol } from '@deploy-configurations/types/protocol'

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
      OPEN_POSITION: 'OpenAAVEV3Position',
      CLOSE_POSITION: 'CloseAAVEV3Position_3',
      ADJUST_RISK_UP: 'AdjustRiskUpAAVEV3Position',
      ADJUST_RISK_DOWN: 'AdjustRiskDownAAVEV3Position',
      DEPOSIT_BORROW: 'AAVEV3DepositBorrow',
      OPEN_DEPOSIT_BORROW: 'AAVEV3OpenDepositBorrow',
      DEPOSIT: 'AAVEV3Deposit',
      BORROW: 'AAVEV3Borrow',
      PAYBACK_WITHDRAW: 'AAVEV3PaybackWithdraw',
    },
  },
  spark: {
    OPEN_POSITION: 'SparkOpenPosition',
    CLOSE_POSITION: 'SparkClosePosition',
    ADJUST_RISK_UP: 'SparkAdjustRiskUp',
    ADJUST_RISK_DOWN: 'SparkAdjustRiskDown',
    DEPOSIT_BORROW: 'SparkDepositBorrow',
    OPEN_DEPOSIT_BORROW: 'SparkOpenDepositBorrow',
    DEPOSIT: 'SparkDeposit',
    BORROW: 'SparkBorrow',
    PAYBACK_WITHDRAW: 'SparkPaybackWithdraw',
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
    CLOSE_POSITION: 'MorphoBlueClosePosition',
    ADJUST_RISK_UP: 'MorphoBlueAdjustRiskUp',
    ADJUST_RISK_DOWN: 'MorphoBlueAdjustRiskDown',
    DEPOSIT_BORROW: 'MorphoBlueDepositBorrow',
    OPEN_DEPOSIT_BORROW: 'MorphoBlueOpenDepositBorrow',
    DEPOSIT: 'MorphoBlueDeposit',
    BORROW: 'MorphoBlueBorrow',
    PAYBACK_WITHDRAW: 'MorphoBluePaybackWithdraw',
  },
  common: {
    CUSTOM_OPERATION: 'CustomOperation',
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
