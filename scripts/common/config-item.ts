import { PartialRecord } from '@helpers/types/common'
import { ContractNames } from '@oasisdex/oasis-actions/src'
import { Address } from '@oasisdex/oasis-actions/src/types'

export type ConfigItem = {
  name: AllowedContractNames
  serviceRegistryName?: ContractNames
  address: Address
}

export type SystemConfigItem = ConfigItem & {
  name: DeployedSystemContractNames
  deploy: boolean
  history: Address[]
  constructorArgs?: Array<number | string>
}

type SwapContractName = 'Swap'
export type CoreContractNamesWithoutSwap =
  | 'ServiceRegistry'
  | 'OperationExecutor'
  | 'OperationStorage'
  | 'OperationsRegistry'
  | 'AccountGuard'
  | 'AccountFactory'
  | 'ChainLogView'
export type CoreContractNames = CoreContractNamesWithoutSwap | SwapContractName
export type AaveV2ContractNames = 'AaveBorrow' | 'AaveDeposit' | 'AaveWithdraw' | 'AavePayback'
export type ActionContractNamesWithoutAaveV2 =
  | 'SwapAction'
  | 'PullToken'
  | 'SendToken'
  | 'SetApproval'
  | 'WrapEth'
  | 'UnwrapEth'
  | 'TakeFlashloan'
  | 'ReturnFunds'
  | 'PositionCreated'
  | 'AaveV3Borrow'
  | 'AaveV3Deposit'
  | 'AaveV3Withdraw'
  | 'AaveV3Payback'
  | 'AaveV3SetEMode'
export type ActionContractNames = ActionContractNamesWithoutAaveV2 | AaveV2ContractNames
type CommonContractNames =
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
  | 'DsProxyRegistry'
  | 'OneInchAggregator'
  | 'AuthorizedCaller'
  | 'FeeRecipient'
  | 'ChainlinkEthUsdPriceFeed'
type AaveProtocolContractNamesV2 =
  | 'PriceOracle'
  | 'LendingPool'
  | 'ProtocolDataProvider'
  | 'WETHGateway'
type AaveProtocolContractNamesV3 = 'AaveOracle' | 'Pool' | 'AaveProtocolDataProvider'
type AaveProtocolContractNames = AaveProtocolContractNamesV2 | AaveProtocolContractNamesV3

export type AllowedContractNames =
  | CoreContractNames
  | ActionContractNames
  | CommonContractNames
  | AaveProtocolContractNames

export type LocalSystemContractNames = 'DsProxyRegistry'
export type DeployedSystemContractNames =
  | CoreContractNames
  | ActionContractNames
  | LocalSystemContractNames

type SwapRecord = PartialRecord<SwapContractName, SystemConfigItem>
type CoreRecord = Record<CoreContractNamesWithoutSwap, SystemConfigItem>
type AaveV2ActionsRecord = PartialRecord<AaveV2ContractNames, SystemConfigItem>
type ActionsRecord = Record<ActionContractNamesWithoutAaveV2, SystemConfigItem>

export type Config = {
  mpa: {
    core: SwapRecord & CoreRecord
    actions: AaveV2ActionsRecord & ActionsRecord
  }
  common: Record<CommonContractNames, ConfigItem>
  aave: {
    v2?: Record<AaveProtocolContractNamesV2, ConfigItem>
    v3: Record<AaveProtocolContractNamesV3, ConfigItem>
  }
}
