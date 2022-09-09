import { BigNumber } from 'bignumber.js'

export const ZERO = new BigNumber(0)
export const ONE = new BigNumber(1)
export const TEN = new BigNumber(10)
export const TEN_THOUSAND = new BigNumber(10000)
export const MAX_UINT =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'

export const CONTRACT_NAMES = {
  common: {
    WETH: 'WETH',
    DAI: 'DAI',
    PULL_TOKEN: 'PullToken',
    SEND_TOKEN: 'SendToken',
    SET_APPROVAL: 'SetApproval',
    TAKE_A_FLASHLOAN: 'TakeFlashloan',
    SWAP_ACTION: 'SwapAction',
    OPERATION_EXECUTOR: 'OperationExecutor',
    OPERATION_STORAGE: 'OperationStorage',
    OPERATIONS_REGISTRY: 'OperationsRegistry',
    ONE_INCH_AGGREGATOR: 'OneInchAggregator',
    SWAP: 'Swap',
    EXCHANGE: 'Exchange',
    UNISWAP_ROUTER: 'UniswapRouter',
    SERVICE_REGISTRY: 'ServiceRegistry',
    WRAP_ETH: 'WrapEth',
    UNWRAP_ETH: 'UnwrapEth',
  },
  aave: {
    DEPOSIT: 'AaveDeposit',
    WITHDRAW: 'AaveWithdraw',
    BORROW: 'AaveBorrow',
    PAYBACK: 'AavePayback',
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
    OPEN_POSITION: 'OpenPosition',
    CLOSE_POSITION: 'ClosePosition',
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
