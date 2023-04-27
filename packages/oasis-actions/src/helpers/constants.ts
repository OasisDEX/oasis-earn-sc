import { BigNumber } from 'bignumber.js'

export const NO_FEE = 0
export const HIGH_MULTIPLE_FEE = 7
export const DEFAULT_FEE = 20
export const FEE_BASE = 10000
// We inflate the estimate fee amount to account for difference between quoted market prices and actual amounts
export const FEE_ESTIMATE_INFLATOR = new BigNumber(0.01)

export const TYPICAL_PRECISION = 18

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export const ZERO = new BigNumber(0)
export const ONE = new BigNumber(1)
export const TEN = new BigNumber(10)
export const FIFTY = new BigNumber(50)
export const HUNDRED = new BigNumber(100)
export const ONE_THOUSAND = new BigNumber(10000)
export const ONE_TEN_THOUSANDTH = new BigNumber(0.0001)
export const TEN_THOUSAND = new BigNumber(10000)
export const MILLION = new BigNumber('1000000')
export const BILLION = new BigNumber('1000000000')
export const MAX_UINT =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'

export const CONTRACT_NAMES = {
  common: {
    PULL_TOKEN: 'PullToken_3',
    SEND_TOKEN: 'SendToken_4',
    SET_APPROVAL: 'SetApproval_3',
    TAKE_A_FLASHLOAN: 'TakeFlashloan_3',
    SWAP_ACTION: 'SwapAction_3',
    WRAP_ETH: 'WrapEth_3',
    UNWRAP_ETH: 'UnwrapEth_3',
    RETURN_FUNDS: 'ReturnFunds_3',
    POSITION_CREATED: 'PositionCreated',

    ACCOUNT_FACTORY: 'AccountFactory',
    OPERATION_EXECUTOR: 'OperationExecutor_2',
    OPERATION_STORAGE: 'OperationStorage_2',
    OPERATIONS_REGISTRY: 'OperationsRegistry_2',
    CHAINLOG_VIEWER: 'ChainLogView',
    ONE_INCH_AGGREGATOR: 'OneInchAggregator',
    SWAP: 'Swap',
    EXCHANGE: 'Exchange',
    UNISWAP_ROUTER: 'UniswapRouter',
    BALANCER_VAULT: 'BalancerVault',
    SERVICE_REGISTRY: 'ServiceRegistry',
    WETH: 'WETH',
    DAI: 'DAI',
    USDC: 'USDC',
  },
  aave: {
    v2: {
      DEPOSIT: 'AaveDeposit_3',
      WITHDRAW: 'AaveWithdraw_3',
      BORROW: 'AaveBorrow_3',
      PAYBACK: 'AavePayback_3',
      LENDING_POOL: 'AaveLendingPool',
      WETH_GATEWAY: 'AaveWethGateway',
    },
    v3: {
      DEPOSIT: 'AaveV3Deposit',
      WITHDRAW: 'AaveV3Withdraw',
      BORROW: 'AaveV3Borrow',
      PAYBACK: 'AaveV3Payback',
      AAVE_POOL: 'AavePool',
      SET_EMODE: 'AaveV3SetEMode',
    },
    L2_ENCODER: 'AaveL2Encoder',
  },
  maker: {
    DEPOSIT: 'MakerDeposit',
    PAYBACK: 'MakerPayback',
    WITHDRAW: 'MakerWithdraw',
    GENERATE: 'MakerGenerate',
    OPEN_VAULT: 'MakerOpenVault',

    MCD_VIEW: 'McdView',
    FLASH_MINT_MODULE: 'McdFlashMintModule',
    MCD_MANAGER: 'McdManager',
    MCD_JUG: 'McdJug',
    MCD_JOIN_DAI: 'McdJoinDai',
    CDP_ALLOW: 'CdpAllow',
    CHAINLOG_VIEW: 'ChainLogView',
  },
  test: {
    DUMMY_ACTION: 'DummyAction',
    DUMMY_OPTIONAL_ACTION: 'DummyOptionalAction',
    DUMMY_SWAP: 'DummySwap',
    DUMMY_EXCHANGE: 'DummyExchange',
    SWAP: 'uSwap',
  },
} as const

export type AllValues<T> = { [K in keyof T]: T[K] extends object ? AllValues<T[K]> : T[K] }[keyof T]

export type ContractNames = AllValues<typeof CONTRACT_NAMES>

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
  common: {
    CUSTOM_OPERATION: 'CustomOperation',
  },
} as const

type ValuesOf<T> = T[keyof T]
type AaveV2Operations = ValuesOf<typeof OPERATION_NAMES['aave']['v2']>
type AaveV3Operations = ValuesOf<typeof OPERATION_NAMES['aave']['v3']>
type MakerOperations = ValuesOf<typeof OPERATION_NAMES['maker']>
type CommonOperations = ValuesOf<typeof OPERATION_NAMES['common']>
export type OperationNames =
  | CommonOperations
  | AaveV2Operations
  | AaveV3Operations
  | MakerOperations

// If configuring a low LTV, we might not need a flashloan (therefore flashloan == 0), but we still perform
// the swap because the actions in operation executor pass args to each other referenced via index.
// 1inch however errors out when trying to swap 0 amount, so we swap some small amount instead.
// This is that amount.
export const UNUSED_FLASHLOAN_AMOUNT = ONE
export const FLASHLOAN_SAFETY_MARGIN = new BigNumber(0.2)
