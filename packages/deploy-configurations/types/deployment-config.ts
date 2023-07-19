import { ContractNames } from '@deploy-configurations/constants'
import { Address } from '@deploy-configurations/types/address'

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
  | 'CBETH'
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
  | 'TBTC'
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
export type AaveV3Protocol = 'AaveOracle' | 'Pool' | 'AavePoolDataProvider' | 'L2Encoder'

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

export type MakerProtocolJoins =
  | 'MCD_JOIN_DAI'
  | 'MCD_JOIN_ETH_A'
  | 'MCD_JOIN_ETH_B'
  | 'MCD_JOIN_ETH_C'
  | 'MCD_JOIN_BAT_A'
  | 'MCD_JOIN_USDC_A'
  | 'MCD_JOIN_USDC_B'
  | 'MCD_JOIN_PSM_USDC_A'
  | 'MCD_JOIN_TUSD_A'
  | 'MCD_JOIN_WBTC_A'
  | 'MCD_JOIN_WBTC_B'
  | 'MCD_JOIN_WBTC_C'
  | 'MCD_JOIN_ZRX_A'
  | 'MCD_JOIN_KNC_A'
  | 'MCD_JOIN_MANA_A'
  | 'MCD_JOIN_USDT_A'
  | 'MCD_JOIN_PAXUSD_A'
  | 'MCD_JOIN_PSM_PAX_A'
  | 'MCD_JOIN_COMP_A'
  | 'MCD_JOIN_LRC_A'
  | 'MCD_JOIN_LINK_A'
  | 'MCD_JOIN_BAL_A'
  | 'MCD_JOIN_YFI_A'
  | 'MCD_JOIN_GUSD_A'
  | 'MCD_JOIN_PSM_GUSD_A'
  | 'MCD_JOIN_UNI_A'
  | 'MCD_JOIN_RENBTC_A'
  | 'MCD_JOIN_AAVE_A'
  | 'MCD_JOIN_MATIC_A'
  | 'MCD_JOIN_WSTETH_A'
  | 'MCD_JOIN_WSTETH_B'
  | 'MCD_JOIN_DIRECT_AAVEV2_DAI'
  | 'MCD_JOIN_GUNIV3DAIUSDC1_A'
  | 'MCD_JOIN_GUNIV3DAIUSDC2_A'
  | 'MCD_JOIN_CRVV1ETHSTETH_A'
  | 'MCD_JOIN_UNIV2DAIETH_A'
  | 'MCD_JOIN_UNIV2WBTCETH_A'
  | 'MCD_JOIN_UNIV2USDCETH_A'
  | 'MCD_JOIN_UNIV2DAIUSDC_A'
  | 'MCD_JOIN_UNIV2ETHUSDT_A'
  | 'MCD_JOIN_UNIV2LINKETH_A'
  | 'MCD_JOIN_UNIV2UNIETH_A'
  | 'MCD_JOIN_UNIV2WBTCDAI_A'
  | 'MCD_JOIN_UNIV2AAVEETH_A'
  | 'MCD_JOIN_UNIV2DAIUSDT_A'
  | 'MCD_JOIN_RWA001_A'
  | 'MCD_JOIN_RWA002_A'
  | 'MCD_JOIN_RWA003_A'
  | 'MCD_JOIN_RWA004_A'
  | 'MCD_JOIN_RWA005_A'
  | 'MCD_JOIN_RWA006_A'
  | 'MCD_JOIN_RETH_A'
  | 'MCD_JOIN_GNO_A'

export type MakerProtocolPips =
  | 'PIP_ETH'
  | 'PIP_BAT'
  | 'PIP_USDC'
  | 'PIP_WBTC'
  | 'PIP_TUSD'
  | 'PIP_WETH'
  | 'PIP_ZRX'
  | 'PIP_KNC'
  | 'PIP_MANA'
  | 'PIP_USDT'
  | 'PIP_PAXUSD'
  | 'PIP_PAX'
  | 'PIP_COMP'
  | 'PIP_LRC'
  | 'PIP_LINK'
  | 'PIP_BAL'
  | 'PIP_YFI'
  | 'PIP_GUSD'
  | 'PIP_UNI'
  | 'PIP_RENBTC'
  | 'PIP_AAVE'
  | 'PIP_MATIC'
  | 'PIP_WSTETH'
  | 'PIP_ADAI'
  | 'PIP_UNIV2DAIETH'
  | 'PIP_UNIV2WBTCETH'
  | 'PIP_UNIV2USDCETH'
  | 'PIP_UNIV2DAIUSDC'
  | 'PIP_UNIV2ETHUSDT'
  | 'PIP_UNIV2LINKETH'
  | 'PIP_UNIV2UNIETH'
  | 'PIP_UNIV2WBTCDAI'
  | 'PIP_UNIV2AAVEETH'
  | 'PIP_UNIV2DAIUSDT'
  | 'PIP_GUNIV3DAIUSDC1'
  | 'PIP_GUNIV3DAIUSDC2'
  | 'PIP_CRVV1ETHSTETH'
  | 'PIP_RWA001'
  | 'PIP_RWA002'
  | 'PIP_RWA003'
  | 'PIP_RWA004'
  | 'PIP_RWA005'
  | 'PIP_RWA006'
  | 'PIP_RETH'
  | 'PIP_GNO'

export type AutomationProtocol = 'AutomationBot' | 'AutomationBotV2' | 'AutomationBotAggregator'
export type AjnaProtocol =
  | 'AjnaPoolInfo'
  | 'AjnaProxyActions'
  | 'AjnaPoolPairs_ETHDAI'
  | 'AjnaPoolPairs_ETHUSDC'
  | 'AjnaPoolPairs_RETHDAI'
  | 'AjnaPoolPairs_RETHETH'
  | 'AjnaPoolPairs_RETHUSDC'
  | 'AjnaPoolPairs_USDCETH'
  | 'AjnaPoolPairs_USDCWBTC'
  | 'AjnaPoolPairs_WBTCDAI'
  | 'AjnaPoolPairs_WBTCUSDC'
  | 'AjnaPoolPairs_WSTETHDAI'
  | 'AjnaPoolPairs_WSTETHETH'
  | 'AjnaPoolPairs_WSTETHUSDC'
  | 'AjnaPoolPairs_CBETHETH'
  | 'AjnaPoolPairs_TBTCWBTC'
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
  | MakerProtocolJoins
  | MakerProtocolPips
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
    v2: Record<AaveV2Protocol, DeploymentConfig>
    v3: Record<AaveV3Protocol, DeploymentConfig>
  }
  maker: {
    common: Record<MakerProtocol, DeploymentConfig>
    joins: Record<MakerProtocolJoins, DeploymentConfig>
    pips: Record<MakerProtocolPips, DeploymentConfig>
  }
  automation: Record<AutomationProtocol, DeploymentConfig>
  ajna: Record<AjnaProtocol, DeploymentConfig>
}
