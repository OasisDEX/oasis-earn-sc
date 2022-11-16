import { BigNumber } from 'bignumber.js'

export const TYPICAL_PRECISION = 18

export const ZERO = new BigNumber(0)
export const ONE = new BigNumber(1)
export const TEN = new BigNumber(10)
export const TEN_THOUSAND = new BigNumber(10000)
export const MAX_UINT =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'

export const CONTRACT_NAMES = {
  common: {
    PULL_TOKEN: 'PullToken_2_0_0',
    SEND_TOKEN: 'SendToken_2_0_0',
    SET_APPROVAL: 'SetApproval_2_0_0',
    TAKE_A_FLASHLOAN: 'TakeFlashloan_2_0_0',
    SWAP_ACTION: 'SwapAction_2_0_0',
    WRAP_ETH: 'WrapEth_2_0_0',
    UNWRAP_ETH: 'UnwrapEth_2_0_0',
    RETURN_FUNDS: 'ReturnFunds_2_0_0',
    PULL_TO_PROXY: 'PullToProxy_1_0_0',

    OPERATION_EXECUTOR: 'OperationExecutor',
    OPERATION_STORAGE: 'OperationStorage',
    OPERATIONS_REGISTRY: 'OperationsRegistry',
    ONE_INCH_AGGREGATOR: 'OneInchAggregator',
    SWAP: 'Swap',
    EXCHANGE: 'Exchange',
    UNISWAP_ROUTER: 'UniswapRouter',
    SERVICE_REGISTRY: 'ServiceRegistry',
    WETH: 'WETH',
    DAI: 'DAI',
  },
  aave: {
    DEPOSIT: 'AaveDeposit_2_0_0',
    WITHDRAW: 'AaveWithdraw_2_0_0',
    BORROW: 'AaveBorrow_2_0_0',
    PAYBACK: 'AavePayback_2_0_0',
    LENDING_POOL: 'AaveLendingPool',
    WETH_GATEWAY: 'AaveWethGateway',
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
  },
  test: {
    DUMMY_ACTION: 'DummyAction',
    DUMMY_SWAP: 'DummySwap',
    DUMMY_EXCHANGE: 'DummyExchange',
    SWAP: 'uSwap',
  },
} as const

export type AllValues<T> = { [K in keyof T]: T[K] extends object ? AllValues<T[K]> : T[K] }[keyof T]

export type ContractNames = AllValues<typeof CONTRACT_NAMES>

export const OPERATION_NAMES = {
  aave: {
    OPEN_POSITION: 'OpenAAVEPosition',
    // OPEN_POSITION_1: 'OpenAAVEPosition_1', // Requires sending deposit
    // OPEN_POSITION_2: 'OpenAAVEPosition_2', // Requires sending collateral
    // OPEN_POSITION_3: 'OpenAAVEPosition_3', // Requires sending deposit & collateral
    CLOSE_POSITION: 'CloseAAVEPosition',
    INCREASE_POSITION: 'IncreaseAAVEPosition',
    DECREASE_POSITION: 'DecreaseAAVEPosition',
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
type AAVEOperations = ValuesOf<typeof OPERATION_NAMES['aave']>
type MakerOperations = ValuesOf<typeof OPERATION_NAMES['maker']>
type CommonOperations = ValuesOf<typeof OPERATION_NAMES['maker']>
export type OperationNames = AAVEOperations | MakerOperations | CommonOperations

// If configuring a low LTV, we might not need a flashloan (therefore flashloan == 0), but we still perform
// the swap because the actions in operation executor pass args to each other referenced via index.
// 1inch however errors out when trying to swap 0 amount, so we swap some small amount instead.
// This is that amount.
export const UNUSED_FLASHLOAN_AMOUNT = ONE
export const FLASHLOAN_SAFETY_MARGIN = new BigNumber(0.2)
