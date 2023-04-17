import { ContractNames } from '@oasisdex/oasis-actions/src'
import { Address } from '@oasisdex/oasis-actions/src/types'

export type ConfigItem = {
  name: Contracts
  serviceRegistryName?: ContractNames
  address: Address
}

export type SystemConfigItem = ConfigItem & {
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

type Common =
  | 'WETH'
  | 'ETH'
  | 'STETH'
  | 'WSTETH'
  | 'DAI'
  | 'USDC'
  | 'WBTC'
  | 'UniswapRouterV3'
  | 'FlashMintModule'
  | 'BalancerVault'
  | 'OneInchAggregator'
  | 'AuthorizedCaller'
  | 'FeeRecipient'
  | 'ChainlinkEthUsdPriceFeed'

type AaveV2Protocol = 'PriceOracle' | 'LendingPool' | 'ProtocolDataProvider' | 'WETHGateway'
type AaveV3Protocol = 'AaveOracle' | 'Pool' | 'AaveProtocolDataProvider'

export type Contracts =
  | CoreContracts
  | SwapContract
  | CoreMainnet
  | Actions
  | Common
  | AaveV2Protocol
  | AaveV3Protocol

export type DeployedSystemContracts = CoreContracts | SwapContract | CoreMainnet | Actions

type SwapRecord = Partial<Record<SwapContract, SystemConfigItem>>
type CoreMainnetRecord = Partial<Record<CoreMainnet, SystemConfigItem>>
type CoreRecord = Record<CoreContracts, SystemConfigItem>

type AaveV2ActionsRecord = Partial<Record<AaveV2Actions, SystemConfigItem>>
type ActionsRecord = Record<Actions, SystemConfigItem>

export type Config = {
  mpa: {
    core: CoreRecord & CoreMainnetRecord & SwapRecord
    actions: ActionsRecord & AaveV2ActionsRecord
  }
  common: Record<Common, ConfigItem>
  aave: {
    v2?: Record<AaveV2Protocol, ConfigItem>
    v3: Record<AaveV3Protocol, ConfigItem>
  }
}
