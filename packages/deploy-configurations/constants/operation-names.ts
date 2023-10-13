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
    OPEN_MULTIPLY_POSITION: 'AjnaOpenMultiplyPosition',
    ADJUST_RISK_UP: 'AjnaAdjustRiskUp',
    ADJUST_RISK_DOWN: 'AjnaAdjustRiskDown',
    DEPOSIT_BORROW: 'AjnaDepositBorrow',
    PAYBACK_WITHDRAW: 'AjnaPaybackWithdraw',
    CLOSE_POSITION_TO_QUOTE: 'AjnaCloseToQuotePosition',
    CLOSE_POSITION_TO_COLLATERAL: 'AjnaCloseToCollateralPosition',
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
type CommonOperationsNames = ValuesOf<(typeof OPERATION_NAMES)['common']>
export type OperationNames =
  | CommonOperationsNames
  | AaveV2OperationsNames
  | AaveV3OperationsNames
  | MakerOperationsNames
  | AjnaOperationsNames
  | SparkOperationsNames
