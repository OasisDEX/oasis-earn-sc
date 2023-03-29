import { ContractNames } from '@oasisdex/oasis-actions/src'
import { Address } from '@oasisdex/oasis-actions/src/types'

export type ConfigItem = {
  name: AllowedContractNames
  serviceRegistryName?: ContractNames
  address: Address
}

export type SystemConfigItem = ConfigItem & {
  deploy: boolean
  history: Address[]
  constructorArgs?: Array<number | string>
}

export type Config = {
  mpa: {
    core: Record<CoreContractNames, SystemConfigItem>
    actions: Record<ActionContractNames, SystemConfigItem>
  }
  common: Record<CommonContractNames, ConfigItem>
  aave: {
    v2: Record<AaveProtocolContractNamesV2, ConfigItem>
    v3: Record<AaveProtocolContractNamesV3, ConfigItem>
  }
}

export type CoreContractNames =
  | 'ServiceRegistry'
  | 'OperationExecutor'
  | 'OperationStorage'
  | 'OperationsRegistry'
  | 'DsProxyRegistry'
  | 'AccountGuard'
  | 'AccountFactory'
  | 'ChainLogView'
  | 'Swap'
type ActionContractNames =
  | 'SwapAction'
  | 'AaveBorrow'
  | 'AaveDeposit'
  | 'AaveWithdraw'
  | 'AavePayback'
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
