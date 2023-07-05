import { Network } from '@deploy-configurations/types/network'

import { ADDRESS_ZERO, loadContractNames } from '../constants'
import { SystemConfig } from '../types/deployment-config'

const SERVICE_REGISTRY_NAMES = loadContractNames(Network.ARBITRUM)

export const config: SystemConfig = {
  mpa: {
    core: {
      ServiceRegistry: {
        name: 'ServiceRegistry',
        deploy: false,
        address: ADDRESS_ZERO,
        history: [ADDRESS_ZERO],
        constructorArgs: [0],
      },
      OperationExecutor: {
        name: 'OperationExecutor',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATION_EXECUTOR,
        history: [ADDRESS_ZERO],
        constructorArgs: ['address:ServiceRegistry'],
      },
      OperationStorage: {
        name: 'OperationStorage',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATION_STORAGE,
        history: [ADDRESS_ZERO],
        constructorArgs: ['address:ServiceRegistry', 'address:OperationExecutor'],
      },
      OperationsRegistry: {
        name: 'OperationsRegistry',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATIONS_REGISTRY,
        history: [ADDRESS_ZERO],
        constructorArgs: [],
      },
      DSProxyFactory: {
        name: 'DSProxyFactory',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_PROXY_FACTORY,
        history: [],
        constructorArgs: [],
      },
      DSProxyRegistry: {
        name: 'DSProxyRegistry',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_PROXY_REGISTRY,
        history: [],
        constructorArgs: ['address:DSProxyFactory'],
      },
      DSGuardFactory: {
        name: 'DSGuardFactory',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_GUARD_FACTORY,
        history: [],
        constructorArgs: [],
      },
      AccountGuard: {
        name: 'AccountGuard',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ACCOUNT_GUARD,
        history: [ADDRESS_ZERO],
        constructorArgs: [],
      },
      AccountFactory: {
        name: 'AccountFactory',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ACCOUNT_FACTORY,
        history: [ADDRESS_ZERO],
        constructorArgs: ['address:AccountGuard'],
      },
      Swap: {
        name: 'Swap',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SWAP,
        history: [],
        constructorArgs: [ADDRESS_ZERO, ADDRESS_ZERO, 20, 'address:ServiceRegistry'],
      },
    },
    actions: {
      PositionCreated: {
        name: 'PositionCreated',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'PositionCreated',
        history: [ADDRESS_ZERO],
        constructorArgs: [],
      },
      SwapAction: {
        name: 'SwapAction',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'SwapAction_3',
        history: [ADDRESS_ZERO],
        constructorArgs: ['address:ServiceRegistry'],
      },
      TakeFlashloan: {
        name: 'TakeFlashloan',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'TakeFlashloan_3',
        history: [ADDRESS_ZERO],
        constructorArgs: ['address:ServiceRegistry', ADDRESS_ZERO, 'address:DSGuardFactory'],
      },
      SetApproval: {
        name: 'SetApproval',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'SetApproval_3',
        history: [ADDRESS_ZERO],
        constructorArgs: ['address:ServiceRegistry'],
      },
      PullToken: {
        name: 'PullToken',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'PullToken_3',
        history: [ADDRESS_ZERO],
        constructorArgs: [],
      },
      SendToken: {
        name: 'SendToken',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'SendToken_4',
        history: [ADDRESS_ZERO],
        constructorArgs: ['address:ServiceRegistry'],
      },
      WrapEth: {
        name: 'WrapEth',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'WrapEth_3',
        history: [ADDRESS_ZERO],
        constructorArgs: ['address:ServiceRegistry'],
      },
      UnwrapEth: {
        name: 'UnwrapEth',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'UnwrapEth_3',
        history: [ADDRESS_ZERO],
        constructorArgs: ['address:ServiceRegistry'],
      },
      ReturnFunds: {
        name: 'ReturnFunds',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'ReturnFunds_3',
        history: [ADDRESS_ZERO],
        constructorArgs: [],
      },
      AaveV3Borrow: {
        name: 'AaveV3Borrow',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'AaveV3Borrow',
        history: [ADDRESS_ZERO],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Withdraw: {
        name: 'AaveV3Withdraw',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'AaveV3Withdraw',
        history: [ADDRESS_ZERO],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Deposit: {
        name: 'AaveV3Deposit',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'AaveV3Deposit',
        history: [ADDRESS_ZERO],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Payback: {
        name: 'AaveV3Payback',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'AaveV3Payback',
        history: [ADDRESS_ZERO],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3SetEMode: {
        name: 'AaveV3SetEMode',
        deploy: false,
        address: ADDRESS_ZERO,
        serviceRegistryName: 'AaveV3SetEMode',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
    },
  },
  common: {
    GnosisSafe: {
      name: 'GnosisSafe',
      address: ADDRESS_ZERO,
    },
    UniswapRouterV3: {
      name: 'UniswapRouterV3',
      address: ADDRESS_ZERO,
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.UNISWAP_ROUTER,
    },
    BalancerVault: {
      name: 'BalancerVault',
      address: ADDRESS_ZERO,
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.BALANCER_VAULT,
    },
    FeeRecipient: {
      name: 'FeeRecipient',
      address: ADDRESS_ZERO,
    },
    AuthorizedCaller: {
      name: 'AuthorizedCaller',
      address: ADDRESS_ZERO,
    },
    OneInchAggregator: {
      name: 'OneInchAggregator',
      address: ADDRESS_ZERO,
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ONE_INCH_AGGREGATOR,
    },
    MerkleRedeemer: {
      name: 'MerkleRedeemer',
      address: ADDRESS_ZERO,
    },
    DssCharter: {
      name: 'DssCharter',
      address: ADDRESS_ZERO,
    },
    DssProxyActions: {
      name: 'DssProxyActions',
      address: ADDRESS_ZERO,
    },
    DssProxyActionsCharter: {
      name: 'DssProxyActionsCharter',
      address: ADDRESS_ZERO,
    },
    DssMultiplyProxyActions: {
      name: 'DssMultiplyProxyActions',
      address: ADDRESS_ZERO,
    },
    DssCropper: {
      name: 'DssCropper',
      address: ADDRESS_ZERO,
    },
    DssProxyActionsCropjoin: {
      name: 'DssProxyActionsCropjoin',
      address: ADDRESS_ZERO,
    },
    DssProxyActionsDsr: {
      name: 'DssProxyActionsDsr',
      address: ADDRESS_ZERO,
    },
    Otc: {
      name: 'Otc',
      address: ADDRESS_ZERO,
    },
    OtcSupportMethods: {
      name: 'OtcSupportMethods',
      address: ADDRESS_ZERO,
    },
    ServiceRegistry: {
      name: 'ServiceRegistry',
      address: ADDRESS_ZERO,
    },
    GuniProxyActions: {
      name: 'GuniProxyActions',
      address: ADDRESS_ZERO,
    },
    GuniResolver: {
      name: 'GuniResolver',
      address: ADDRESS_ZERO,
    },
    GuniRouter: {
      name: 'GuniRouter',
      address: ADDRESS_ZERO,
    },
    CdpRegistry: {
      name: 'CdpRegistry',
      address: ADDRESS_ZERO,
    },
    DefaultExchange: {
      name: 'DefaultExchange',
      address: ADDRESS_ZERO,
    },
    NoFeesExchange: {
      name: 'NoFeesExchange',
      address: ADDRESS_ZERO,
    },
    LowerFeesExchange: {
      name: 'LowerFeesExchange',
      address: ADDRESS_ZERO,
    },
    LidoCrvLiquidityFarmingReward: {
      name: 'LidoCrvLiquidityFarmingReward',
      address: ADDRESS_ZERO,
    },
    ChainlinkPriceOracle_USDCUSD: {
      name: 'ChainlinkPriceOracle_USDCUSD',
      address: '0x50834f3163758fcc1df9973b6e91f0f0f0434ad3',
    },
    ChainlinkPriceOracle_ETHUSD: {
      name: 'ChainlinkPriceOracle_ETHUSD',
      address: '0x639fe6ab55c921f74e7fac1ee960c0b6293ba612',
    },
    ADAI: { name: 'ADAI', address: ADDRESS_ZERO },
    AAVE: { name: 'AAVE', address: ADDRESS_ZERO },
    BAL: { name: 'BAL', address: ADDRESS_ZERO },
    BAT: { name: 'BAT', address: ADDRESS_ZERO },
    CBETH: { name: 'CBETH', address: ADDRESS_ZERO },
    COMP: { name: 'COMP', address: ADDRESS_ZERO },
    CRVV1ETHSTETH: { name: 'CRVV1ETHSTETH', address: ADDRESS_ZERO },
    DAI: {
      name: 'DAI',
      address: ADDRESS_ZERO,
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DAI,
    },
    ETH: { name: 'ETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' },
    GNO: { name: 'GNO', address: ADDRESS_ZERO },
    GUNIV3DAIUSDC1: {
      name: 'GUNIV3DAIUSDC1',
      address: ADDRESS_ZERO,
    },
    GUNIV3DAIUSDC2: {
      name: 'GUNIV3DAIUSDC2',
      address: ADDRESS_ZERO,
    },
    GUSD: { name: 'GUSD', address: ADDRESS_ZERO },
    KNC: { name: 'KNC', address: ADDRESS_ZERO },
    LDO: { name: 'LDO', address: ADDRESS_ZERO },
    LINK: { name: 'LINK', address: ADDRESS_ZERO },
    LRC: { name: 'LRC', address: ADDRESS_ZERO },
    MANA: { name: 'MANA', address: ADDRESS_ZERO },
    MATIC: { name: 'MATIC', address: ADDRESS_ZERO },
    PAX: { name: 'PAX', address: ADDRESS_ZERO },
    PAXUSD: { name: 'PAXUSD', address: ADDRESS_ZERO },
    RENBTC: { name: 'RENBTC', address: ADDRESS_ZERO },
    RETH: { name: 'RETH', address: ADDRESS_ZERO },
    RWA001: { name: 'RWA001', address: ADDRESS_ZERO },
    RWA002: { name: 'RWA002', address: ADDRESS_ZERO },
    RWA003: { name: 'RWA003', address: ADDRESS_ZERO },
    RWA004: { name: 'RWA004', address: ADDRESS_ZERO },
    RWA005: { name: 'RWA005', address: ADDRESS_ZERO },
    RWA006: { name: 'RWA006', address: ADDRESS_ZERO },
    STETH: { name: 'STETH', address: ADDRESS_ZERO },
    TUSD: { name: 'TUSD', address: ADDRESS_ZERO },
    UNI: { name: 'UNI', address: ADDRESS_ZERO },
    UNIV2AAVEETH: { name: 'UNIV2AAVEETH', address: ADDRESS_ZERO },
    UNIV2DAIETH: { name: 'UNIV2DAIETH', address: ADDRESS_ZERO },
    UNIV2DAIUSDC: { name: 'UNIV2DAIUSDC', address: ADDRESS_ZERO },
    UNIV2DAIUSDT: { name: 'UNIV2DAIUSDT', address: ADDRESS_ZERO },
    UNIV2ETHUSDT: { name: 'UNIV2ETHUSDT', address: ADDRESS_ZERO },
    UNIV2LINKETH: { name: 'UNIV2LINKETH', address: ADDRESS_ZERO },
    UNIV2UNIETH: { name: 'UNIV2UNIETH', address: ADDRESS_ZERO },
    UNIV2USDCETH: { name: 'UNIV2USDCETH', address: ADDRESS_ZERO },
    UNIV2WBTCDAI: { name: 'UNIV2WBTCDAI', address: ADDRESS_ZERO },
    UNIV2WBTCETH: { name: 'UNIV2WBTCETH', address: ADDRESS_ZERO },
    USDC: {
      name: 'USDC',
      address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.USDC,
    },
    USDT: { name: 'USDT', address: ADDRESS_ZERO },
    WBTC: {
      name: 'WBTC',
      address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WBTC,
    },
    WETH: {
      name: 'WETH',
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WETH,
    },
    WSTETH: {
      name: 'WSTETH',
      address: '0x5979D7b546E38E414F7E9822514be443A4800529',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WSTETH,
    },
    YFI: { name: 'YFI', address: ADDRESS_ZERO },
    ZRX: { name: 'ZRX', address: ADDRESS_ZERO },
  },
  aave: {
    v2: {
      PriceOracle: {
        name: 'PriceOracle',
        address: ADDRESS_ZERO,
      },
      LendingPool: {
        name: 'LendingPool',
        address: ADDRESS_ZERO,
      },
      ProtocolDataProvider: {
        name: 'ProtocolDataProvider',
        address: ADDRESS_ZERO,
      },
      WETHGateway: {
        name: 'WETHGateway',
        address: ADDRESS_ZERO,
      },
    },
    v3: {
      AaveOracle: {
        name: 'AaveOracle',
        address: '0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7',
      },
      Pool: {
        name: 'Pool',
        address: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.AAVE_POOL,
      },
      AavePoolDataProvider: {
        name: 'AavePoolDataProvider',
        address: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
      },
      L2Encoder: {
        name: 'L2Encoder',
        address: '0x9abADECD08572e0eA5aF4d47A9C7984a5AA503dC',
      },
    },
  },
  maker: {
    common: {
      FlashMintModule: {
        name: 'FlashMintModule',
        address: ADDRESS_ZERO,
      },
      Chainlog: {
        name: 'Chainlog',
        address: ADDRESS_ZERO,
      },
      CdpManager: {
        name: 'CdpManager',
        address: ADDRESS_ZERO,
      },
      GetCdps: {
        name: 'GetCdps',
        address: ADDRESS_ZERO,
      },
      Jug: {
        name: 'Jug',
        address: ADDRESS_ZERO,
      },
      Pot: {
        name: 'Pot',
        address: ADDRESS_ZERO,
      },
      End: {
        name: 'End',
        address: ADDRESS_ZERO,
      },
      Spot: {
        name: 'Spot',
        address: ADDRESS_ZERO,
      },
      Dog: {
        name: 'Dog',
        address: ADDRESS_ZERO,
      },
      Vat: {
        name: 'Vat',
        address: ADDRESS_ZERO,
      },
      McdGov: {
        name: 'McdGov',
        address: ADDRESS_ZERO,
      },
    },
    joins: {
      MCD_JOIN_DAI: {
        name: 'MCD_JOIN_DAI',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_ETH_A: {
        name: 'MCD_JOIN_ETH_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_ETH_B: {
        name: 'MCD_JOIN_ETH_B',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_ETH_C: {
        name: 'MCD_JOIN_ETH_C',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_BAT_A: {
        name: 'MCD_JOIN_BAT_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_USDC_A: {
        name: 'MCD_JOIN_USDC_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_USDC_B: {
        name: 'MCD_JOIN_USDC_B',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_PSM_USDC_A: {
        name: 'MCD_JOIN_PSM_USDC_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_TUSD_A: {
        name: 'MCD_JOIN_TUSD_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_WBTC_A: {
        name: 'MCD_JOIN_WBTC_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_WBTC_B: {
        name: 'MCD_JOIN_WBTC_B',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_WBTC_C: {
        name: 'MCD_JOIN_WBTC_C',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_ZRX_A: {
        name: 'MCD_JOIN_ZRX_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_KNC_A: {
        name: 'MCD_JOIN_KNC_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_MANA_A: {
        name: 'MCD_JOIN_MANA_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_USDT_A: {
        name: 'MCD_JOIN_USDT_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_PAXUSD_A: {
        name: 'MCD_JOIN_PAXUSD_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_PSM_PAX_A: {
        name: 'MCD_JOIN_PSM_PAX_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_COMP_A: {
        name: 'MCD_JOIN_COMP_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_LRC_A: {
        name: 'MCD_JOIN_LRC_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_LINK_A: {
        name: 'MCD_JOIN_LINK_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_BAL_A: {
        name: 'MCD_JOIN_BAL_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_YFI_A: {
        name: 'MCD_JOIN_YFI_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_GUSD_A: {
        name: 'MCD_JOIN_GUSD_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_PSM_GUSD_A: {
        name: 'MCD_JOIN_PSM_GUSD_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_UNI_A: {
        name: 'MCD_JOIN_UNI_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_RENBTC_A: {
        name: 'MCD_JOIN_RENBTC_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_AAVE_A: {
        name: 'MCD_JOIN_AAVE_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_MATIC_A: {
        name: 'MCD_JOIN_MATIC_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_WSTETH_A: {
        name: 'MCD_JOIN_WSTETH_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_WSTETH_B: {
        name: 'MCD_JOIN_WSTETH_B',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_UNIV2DAIETH_A: {
        name: 'MCD_JOIN_UNIV2DAIETH_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_UNIV2WBTCETH_A: {
        name: 'MCD_JOIN_UNIV2WBTCETH_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_UNIV2USDCETH_A: {
        name: 'MCD_JOIN_UNIV2USDCETH_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_UNIV2DAIUSDC_A: {
        name: 'MCD_JOIN_UNIV2DAIUSDC_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_UNIV2ETHUSDT_A: {
        name: 'MCD_JOIN_UNIV2ETHUSDT_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_UNIV2LINKETH_A: {
        name: 'MCD_JOIN_UNIV2LINKETH_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_UNIV2UNIETH_A: {
        name: 'MCD_JOIN_UNIV2UNIETH_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_UNIV2WBTCDAI_A: {
        name: 'MCD_JOIN_UNIV2WBTCDAI_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_UNIV2AAVEETH_A: {
        name: 'MCD_JOIN_UNIV2AAVEETH_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_UNIV2DAIUSDT_A: {
        name: 'MCD_JOIN_UNIV2DAIUSDT_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_RWA001_A: {
        name: 'MCD_JOIN_RWA001_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_RWA002_A: {
        name: 'MCD_JOIN_RWA002_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_RWA003_A: {
        name: 'MCD_JOIN_RWA003_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_RWA004_A: {
        name: 'MCD_JOIN_RWA004_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_RWA005_A: {
        name: 'MCD_JOIN_RWA005_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_RWA006_A: {
        name: 'MCD_JOIN_RWA006_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_RETH_A: {
        name: 'MCD_JOIN_RETH_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_GNO_A: {
        name: 'MCD_JOIN_GNO_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_DIRECT_AAVEV2_DAI: {
        name: 'MCD_JOIN_DIRECT_AAVEV2_DAI',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_GUNIV3DAIUSDC1_A: {
        name: 'MCD_JOIN_GUNIV3DAIUSDC1_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_GUNIV3DAIUSDC2_A: {
        name: 'MCD_JOIN_GUNIV3DAIUSDC2_A',
        address: ADDRESS_ZERO,
      },
      MCD_JOIN_CRVV1ETHSTETH_A: {
        name: 'MCD_JOIN_CRVV1ETHSTETH_A',
        address: ADDRESS_ZERO,
      },
    },
    pips: {
      PIP_ETH: {
        name: 'PIP_ETH',
        address: ADDRESS_ZERO,
      },
      PIP_BAT: {
        name: 'PIP_BAT',
        address: ADDRESS_ZERO,
      },
      PIP_USDC: {
        name: 'PIP_USDC',
        address: ADDRESS_ZERO,
      },
      PIP_WBTC: {
        name: 'PIP_WBTC',
        address: ADDRESS_ZERO,
      },
      PIP_TUSD: {
        name: 'PIP_TUSD',
        address: ADDRESS_ZERO,
      },
      PIP_ZRX: {
        name: 'PIP_ZRX',
        address: ADDRESS_ZERO,
      },
      PIP_KNC: {
        name: 'PIP_KNC',
        address: ADDRESS_ZERO,
      },
      PIP_MANA: {
        name: 'PIP_MANA',
        address: ADDRESS_ZERO,
      },
      PIP_USDT: {
        name: 'PIP_USDT',
        address: ADDRESS_ZERO,
      },
      PIP_PAXUSD: {
        name: 'PIP_PAXUSD',
        address: ADDRESS_ZERO,
      },
      PIP_PAX: {
        name: 'PIP_PAX',
        address: ADDRESS_ZERO,
      },
      PIP_COMP: {
        name: 'PIP_COMP',
        address: ADDRESS_ZERO,
      },
      PIP_LRC: {
        name: 'PIP_LRC',
        address: ADDRESS_ZERO,
      },
      PIP_LINK: {
        name: 'PIP_LINK',
        address: ADDRESS_ZERO,
      },
      PIP_BAL: {
        name: 'PIP_BAL',
        address: ADDRESS_ZERO,
      },
      PIP_YFI: {
        name: 'PIP_YFI',
        address: ADDRESS_ZERO,
      },
      PIP_GUSD: {
        name: 'PIP_GUSD',
        address: ADDRESS_ZERO,
      },
      PIP_UNI: {
        name: 'PIP_UNI',
        address: ADDRESS_ZERO,
      },
      PIP_RENBTC: {
        name: 'PIP_RENBTC',
        address: ADDRESS_ZERO,
      },
      PIP_AAVE: {
        name: 'PIP_AAVE',
        address: ADDRESS_ZERO,
      },
      PIP_MATIC: {
        name: 'PIP_MATIC',
        address: ADDRESS_ZERO,
      },
      PIP_WSTETH: {
        name: 'PIP_WSTETH',
        address: ADDRESS_ZERO,
      },
      PIP_ADAI: {
        name: 'PIP_ADAI',
        address: ADDRESS_ZERO,
      },
      PIP_UNIV2DAIETH: {
        name: 'PIP_UNIV2DAIETH',
        address: ADDRESS_ZERO,
      },
      PIP_UNIV2WBTCETH: {
        name: 'PIP_UNIV2WBTCETH',
        address: ADDRESS_ZERO,
      },
      PIP_UNIV2USDCETH: {
        name: 'PIP_UNIV2USDCETH',
        address: ADDRESS_ZERO,
      },
      PIP_UNIV2DAIUSDC: {
        name: 'PIP_UNIV2DAIUSDC',
        address: ADDRESS_ZERO,
      },
      PIP_UNIV2ETHUSDT: {
        name: 'PIP_UNIV2ETHUSDT',
        address: ADDRESS_ZERO,
      },
      PIP_UNIV2LINKETH: {
        name: 'PIP_UNIV2LINKETH',
        address: ADDRESS_ZERO,
      },
      PIP_UNIV2UNIETH: {
        name: 'PIP_UNIV2UNIETH',
        address: ADDRESS_ZERO,
      },
      PIP_UNIV2WBTCDAI: {
        name: 'PIP_UNIV2WBTCDAI',
        address: ADDRESS_ZERO,
      },
      PIP_UNIV2AAVEETH: {
        name: 'PIP_UNIV2AAVEETH',
        address: ADDRESS_ZERO,
      },
      PIP_UNIV2DAIUSDT: {
        name: 'PIP_UNIV2DAIUSDT',
        address: ADDRESS_ZERO,
      },
      PIP_GUNIV3DAIUSDC1: {
        name: 'PIP_GUNIV3DAIUSDC1',
        address: ADDRESS_ZERO,
      },
      PIP_GUNIV3DAIUSDC2: {
        name: 'PIP_GUNIV3DAIUSDC2',
        address: ADDRESS_ZERO,
      },
      PIP_CRVV1ETHSTETH: {
        name: 'PIP_CRVV1ETHSTETH',
        address: ADDRESS_ZERO,
      },
      PIP_RWA001: {
        name: 'PIP_RWA001',
        address: ADDRESS_ZERO,
      },
      PIP_RWA002: {
        name: 'PIP_RWA002',
        address: ADDRESS_ZERO,
      },
      PIP_RWA003: {
        name: 'PIP_RWA003',
        address: ADDRESS_ZERO,
      },
      PIP_RWA004: {
        name: 'PIP_RWA004',
        address: ADDRESS_ZERO,
      },
      PIP_RWA005: {
        name: 'PIP_RWA005',
        address: ADDRESS_ZERO,
      },
      PIP_RWA006: {
        name: 'PIP_RWA006',
        address: ADDRESS_ZERO,
      },
      PIP_RETH: {
        name: 'PIP_RETH',
        address: ADDRESS_ZERO,
      },
      PIP_GNO: {
        name: 'PIP_GNO',
        address: ADDRESS_ZERO,
      },
      PIP_WETH: {
        name: 'PIP_WETH',
        address: ADDRESS_ZERO,
      },
    },
  },
  automation: {
    AutomationBot: {
      name: 'AutomationBot',
      address: ADDRESS_ZERO,
    },
    AutomationBotV2: {
      name: 'AutomationBotV2',
      address: ADDRESS_ZERO,
    },
    AutomationBotAggregator: {
      name: 'AutomationBotAggregator',
      address: ADDRESS_ZERO,
    },
  },
  ajna: {
    AjnaPoolInfo: {
      name: 'AjnaPoolInfo',
      address: ADDRESS_ZERO,
    },
    AjnaProxyActions: {
      name: 'AjnaProxyActions',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_ETHDAI: {
      name: 'AjnaPoolPairs_ETHDAI',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_ETHUSDC: {
      name: 'AjnaPoolPairs_ETHUSDC',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_RETHDAI: {
      name: 'AjnaPoolPairs_RETHDAI',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_RETHETH: {
      name: 'AjnaPoolPairs_RETHETH',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_RETHUSDC: {
      name: 'AjnaPoolPairs_RETHUSDC',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_USDCDAI: {
      name: 'AjnaPoolPairs_USDCDAI',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_USDCETH: {
      name: 'AjnaPoolPairs_USDCETH',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_USDCWBTC: {
      name: 'AjnaPoolPairs_USDCWBTC',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_WBTCDAI: {
      name: 'AjnaPoolPairs_WBTCDAI',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_WBTCUSDC: {
      name: 'AjnaPoolPairs_WBTCUSDC',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_WSTETHDAI: {
      name: 'AjnaPoolPairs_WSTETHDAI',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_WSTETHETH: {
      name: 'AjnaPoolPairs_WSTETHUSDC',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_WSTETHUSDC: {
      name: 'AjnaPoolPairs_WSTETHUSDC',
      address: ADDRESS_ZERO,
    },
    AjnaRewardsManager: {
      name: 'AjnaRewardsManager',
      address: ADDRESS_ZERO,
    },
    AjnaRewardsClaimer: {
      name: 'AjnaRewardsClaimer',
      address: ADDRESS_ZERO,
    },
  },
}
