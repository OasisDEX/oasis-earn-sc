import { ContractNames } from '@dma-deployments/constants'
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
  | 'Swap'

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

export type Tokens =
  | 'AAVE'
  | 'ADAI'
  | 'BAL'
  | 'BAT'
  | 'COMP'
  | 'CRVV1ETHSTETH'
  | 'DAI'
  | 'ETH'
  | 'GNO'
  | 'GUNIV3DAIUSDC1'
  | 'GUNIV3DAIUSDC2'
  | 'GUSD'
  | 'KNC'
  | 'LDO'
  | 'LINK'
  | 'LRC'
  | 'MANA'
  | 'MATIC'
  | 'PAX'
  | 'PAXUSD'
  | 'RENBTC'
  | 'RETH'
  | 'RWA001'
  | 'RWA002'
  | 'RWA003'
  | 'RWA004'
  | 'RWA005'
  | 'RWA006'
  | 'STETH'
  | 'TUSD'
  | 'UNI'
  | 'UNIV2AAVEETH'
  | 'UNIV2DAIETH'
  | 'UNIV2DAIUSDC'
  | 'UNIV2DAIUSDT'
  | 'UNIV2ETHUSDT'
  | 'UNIV2LINKETH'
  | 'UNIV2UNIETH'
  | 'UNIV2USDCETH'
  | 'UNIV2WBTCDAI'
  | 'UNIV2WBTCETH'
  | 'USDC'
  | 'USDT'
  | 'WBTC'
  | 'WETH'
  | 'WSTETH'
  | 'YFI'
  | 'ZRX'

export type Common =
  | Tokens
  | 'UniswapRouterV3'
  | 'BalancerVault'
  | 'OneInchAggregator'
  | 'AuthorizedCaller'
  | 'FeeRecipient'
  | 'GnosisSafe'
  | 'MerkleRedeemer'
  | 'DssCharter'
  | 'DssProxyActions'
  | 'DssProxyActionsCharter'
  | 'DssMultiplyProxyActions'
  | 'DssCropper'
  | 'DssProxyActionsCropjoin'
  | 'DssProxyActionsDsr'
  | 'Otc'
  | 'OtcSupportMethods'
  | 'ServiceRegistry'
  | 'GuniProxyActions'
  | 'GuniResolver'
  | 'GuniRouter'
  | 'CdpRegistry'
  | 'DefaultExchange'
  | 'NoFeesExchange'
  | 'LowerFeesExchange'
  | 'LidoCrvLiquidityFarmingReward'
  | 'ChainlinkPriceOracle_USDCUSD'
  | 'ChainlinkPriceOracle_ETHUSD'

export type AaveV2Protocol = 'PriceOracle' | 'LendingPool' | 'ProtocolDataProvider' | 'WETHGateway'
export type AaveV3Protocol = 'AaveOracle' | 'Pool' | 'AaveProtocolDataProvider'

export type MakerProtocol =
  | 'FlashMintModule'
  | 'Chainlog'
  | 'CdpManager'
  | 'GetCdps'
  | 'Jug'
  | 'Pot'
  | 'End'
  | 'Spot'
  | 'Dog'
  | 'Vat'
  | 'McdGov'
  | 'JoinDAI'
  | 'JoinETH_A'
  | 'PipWETH'
  | 'PipLINK'

export type AutomationProtocol = 'AutomationBot' | 'AutomationBotV2' | 'AutomationBotAggregator'
export type AjnaProtocol =
  | 'AjnaPoolInfo'
  | 'AjnaProxyActions'
  | 'AjnaPoolPairs_WBTCUSDC'
  | 'AjnaPoolPairs_ETHUSDC'
  | 'AjnaRewardsManager'
  | 'AjnaRewardsClaimer'

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
  | AutomationProtocol
  | AjnaProtocol

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
  AUTOMATION = 'automation',
  AJNA = 'ajna',
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
  automation: Record<AutomationProtocol, DeploymentConfig>
  ajna: Record<AjnaProtocol, DeploymentConfig>
}

// export type SystemKeys = keyof SystemConfig
