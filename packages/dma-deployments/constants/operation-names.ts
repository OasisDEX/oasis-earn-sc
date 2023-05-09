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
      CLOSE_POSITION: 'CloseAAVEV3Position_2',
      ADJUST_RISK_UP: 'AdjustRiskUpAAVEV3Position',
      ADJUST_RISK_DOWN: 'AdjustRiskDownAAVEV3Position',
      DEPOSIT_BORROW: 'AAVEV3DepositBorrow',
      OPEN_DEPOSIT_BORROW: 'AAVEV3OpenDepositBorrow',
      DEPOSIT: 'AAVEV3Deposit',
      BORROW: 'AAVEV3Borrow',
      PAYBACK_WITHDRAW: 'AAVEV3PaybackWithdraw',
    },
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
    CLOSE_POSITION: 'AjnaClosePosition',
  },
  common: {
    CUSTOM_OPERATION: 'CustomOperation',
  },
} as const

type ValuesOf<T> = T[keyof T]
type AaveV2Operations = ValuesOf<(typeof OPERATION_NAMES)['aave']['v2']>
type AaveV3Operations = ValuesOf<(typeof OPERATION_NAMES)['aave']['v3']>
type MakerOperations = ValuesOf<(typeof OPERATION_NAMES)['maker']>
type AjnaOperations = ValuesOf<(typeof OPERATION_NAMES)['ajna']>
type CommonOperations = ValuesOf<(typeof OPERATION_NAMES)['common']>
export type OperationNames =
  | CommonOperations
  | AaveV2Operations
  | AaveV3Operations
  | MakerOperations
  | AjnaOperations
