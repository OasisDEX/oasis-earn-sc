import { ContractNames } from '@dma-deployments/constants/contract-names'
import { Address } from '@dma-deployments/types/address'

export type DeploymentConfig = {
  name: Contracts
  serviceRegistryName?: ContractNames
  address: Address
}

export type SystemConfigItem = DeploymentConfig & {
  name: DeployedSystemContracts
  deploy: boolean
  history: Address[]
  constructorArgs?: Array<number | string>
}

type SwapContract = 'Swap' | 'uSwap'
type CoreMainnet = 'ChainLogView'
export type CoreContracts =
  | 'ServiceRegistry'
  | 'OperationExecutor'
  | 'OperationStorage'
  | 'OperationsRegistry'
  | 'DSProxyFactory'
  | 'DSProxyRegistry'
  | 'DSGuardFactory'
  | 'AccountGuard'
  | 'AccountFactory'

export type AaveV2Actions = 'AaveBorrow' | 'AaveDeposit' | 'AaveWithdraw' | `AavePayback`

export type AaveV3Actions =
  | `AaveV3Borrow`
  | `AaveV3Deposit`
  | `AaveV3Withdraw`
  | `AaveV3Payback`
  | `AaveV3SetEMode`

export type CoreActions =
  | 'SwapAction'
  | 'PullToken'
  | 'SendToken'
  | 'SetApproval'
  | 'WrapEth'
  | 'UnwrapEth'
  | 'TakeFlashloan'
  | 'ReturnFunds'
  | 'PositionCreated'

export type Actions = CoreActions | AaveV3Actions

export type Common =
  | 'WETH'
  | 'ETH'
  | 'STETH'
  | 'WSTETH'
  | 'DAI'
  | 'USDC'
  | 'USDT'
  | 'WBTC'
  | 'LINK'
  | 'UniswapRouterV3'
  | 'BalancerVault'
  | 'OneInchAggregator'
  | 'AuthorizedCaller'
  | 'FeeRecipient'
  | 'GnosisSafe'
  | 'ChainlinkEthUsdPriceFeed'

export type AaveV2Protocol = 'PriceOracle' | 'LendingPool' | 'ProtocolDataProvider' | 'WETHGateway'
export type AaveV3Protocol = 'AaveOracle' | 'Pool' | 'AaveProtocolDataProvider'

export type MakerProtocol =
  | 'FlashMintModule'
  | 'Chainlog'
  | 'CdpManager'
  | 'GetCdps'
  | 'Jug'
  | 'JoinDAI'
  | 'JoinETH_A'
  | 'PipWETH'
  | 'PipLINK'

export type Contracts =
  | CoreContracts
  | SwapContract
  | CoreMainnet
  | Actions
  | AaveV2Actions
  | Common
  | AaveV2Protocol
  | AaveV3Protocol
  | MakerProtocol

export type DeployedSystemContracts =
  | CoreContracts
  | SwapContract
  | CoreMainnet
  | Actions
  | AaveV2Actions

type SwapRecord = Partial<Record<SwapContract, SystemConfigItem>>
type CoreMainnetRecord = Partial<Record<CoreMainnet, SystemConfigItem>>
type CoreRecord = Record<CoreContracts, SystemConfigItem>

type AaveV2ActionsRecord = Partial<Record<AaveV2Actions, SystemConfigItem>>
export type ActionsRecord = Record<Actions, SystemConfigItem>

export enum SystemKeys {
  MPA = 'mpa',
  COMMON = 'common',
  AAVE = 'aave',
  MAKER = 'maker',
}

export type SystemConfig = {
  mpa: {
    core: CoreRecord & CoreMainnetRecord & SwapRecord
    actions: ActionsRecord & AaveV2ActionsRecord
  }
  common: Record<Common, DeploymentConfig>
  aave: {
    v2?: Record<AaveV2Protocol, DeploymentConfig>
    v3: Record<AaveV3Protocol, DeploymentConfig>
  }
  maker: Record<MakerProtocol, DeploymentConfig>
}

// export type SystemKeys = keyof SystemConfig
