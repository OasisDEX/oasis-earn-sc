import { ADDRESS_ZERO, loadContractNames } from '@deploy-configurations/constants'
import { SystemConfig } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'

const SERVICE_REGISTRY_NAMES = loadContractNames(Network.OPTIMISM)

export const config: SystemConfig = {
  mpa: {
    core: {
      ServiceRegistry: {
        name: 'ServiceRegistry',
        deploy: true,
        address: '0x063E4242CD7C2421f67e21D7297c74bbDFEF7b0E',
        history: ['0xf22F17B1D2354B4F4F52e4d164e4eB5e1f0A6Ba6'],
        constructorArgs: [0],
      },
      OperationExecutor: {
        name: 'OperationExecutor',
        deploy: true,
        address: '0xFDFf46fF5752CE2A4CAbAAf5a2cFF3744E1D09de',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATION_EXECUTOR,
        history: ['0x5AB3e51608cEa26090445CA89bc91628C8bB99f9'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      OperationStorage: {
        name: 'OperationStorage',
        deploy: true,
        address: '0x6d3af85e27686FfF7686b2FAe174b0a7d8c95e16',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATION_STORAGE,
        history: ['0xd4FEaf1023CD6998053a1eb02460000980Cc908f'],
        constructorArgs: ['address:ServiceRegistry', 'address:OperationExecutor'],
      },
      OperationsRegistry: {
        name: 'OperationsRegistry',
        deploy: true,
        address: '0x3Dd262181BA245184a903CD8B77E23417f815669',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATIONS_REGISTRY,
        history: ['0x392ACeBea829373A3eFDc0dA80a16003106d8f6E'],
        constructorArgs: [],
      },
      DSProxyFactory: {
        name: 'DSProxyFactory',
        deploy: true,
        address: '0x93dFeCd48491eCc6F6EC82B0fEE1Cba9eF9C941A',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_PROXY_FACTORY,
        history: [],
        constructorArgs: [],
      },
      DSProxyRegistry: {
        name: 'DSProxyRegistry',
        deploy: true,
        address: '0x4EcDc277484D71A3BD15f36C858aEc2C56803869',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_PROXY_REGISTRY,
        history: [],
        constructorArgs: ['address:DSProxyFactory'],
      },
      DSGuardFactory: {
        name: 'DSGuardFactory',
        deploy: true,
        address: '0x7bBe5f9C95E2994C420B3Af063e74e5F87b2A3B5',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_GUARD_FACTORY,
        history: [],
        constructorArgs: [],
      },
      AccountGuard: {
        name: 'AccountGuard',
        deploy: true,
        address: '0x916411367fC2f0dc828790eA03CF317eC74E24E4',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ACCOUNT_GUARD,
        history: ['0x63059cC2533344B65372983D4B6258b2cbbBF0Da'],
        constructorArgs: [],
      },
      AccountFactory: {
        name: 'AccountFactory',
        deploy: true,
        address: '0xaaf64927BaFe68E389DE3627AA6b52D81bdA2323',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ACCOUNT_FACTORY,
        history: ['0xE166a06809FD35Cece10df9Cace87BbDB9a48F66'],
        constructorArgs: ['address:AccountGuard'],
      },
      Swap: {
        name: 'Swap',
        deploy: false,
        address: '0x4De3CA09e803969408f83F453416b3e2D70C12Fe',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SWAP,
        history: [],
        constructorArgs: [
          '0x85f9b7408afE6CEb5E46223451f5d4b832B522dc',
          '0xC7b548AD9Cf38721810246C079b2d8083aba8909',
          20,
          'address:ServiceRegistry',
        ],
      },
    },
    actions: {
      PositionCreated: {
        name: 'PositionCreated',
        deploy: true,
        address: '0x8061c24823094E51e57A4a5cF8bEd3CCf09d316F',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.POSITION_CREATED,
        history: ['0xE7aA0939F0cFF45162A22751CbE0009c689EA256'],
        constructorArgs: [],
      },
      SwapAction: {
        name: 'SwapAction',
        deploy: true,
        address: '0x398105CD43115b54A0EFE0b210D99c596e4571A7',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SWAP_ACTION,
        history: ['0x55D4d311Cd9B2dD5693FB51f06DbE50B9Da84D13'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      TakeFlashloan: {
        name: 'TakeFlashloan',
        deploy: true,
        address: '0x080bB3a23098D71a4e8fc5dE8f1Cbb83553BBc57',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.TAKE_A_FLASHLOAN,
        history: ['0x53958191c3077eDe3Ca90Eb840283df063FC1be3'],
        constructorArgs: [
          'address:ServiceRegistry',
          '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
          'address:DSGuardFactory',
        ],
      },
      SetApproval: {
        name: 'SetApproval',
        deploy: true,
        address: '0x18ca8bE41D32727383bC0F98705f7662ed0B7E28',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SET_APPROVAL,
        history: ['0x983EFCA0Fd5F9B03f75BbBD41F4BeD3eC20c96d8'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      PullToken: {
        name: 'PullToken',
        deploy: true,
        address: '0x414958801DC53E840501f507D7A0FEBE55806200',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.PULL_TOKEN,
        history: ['0xFAf9D0B7B92e8B281CaF10b42970179B45CA6412'],
        constructorArgs: [],
      },
      SendToken: {
        name: 'SendToken',
        deploy: true,
        address: '0xAa4C55A8dd5b0e923056676D544FC20bb5D5e3A3',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SEND_TOKEN,
        history: ['0xeB54C366512c4d59A222A251ea7316568859E08C'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      WrapEth: {
        name: 'WrapEth',
        deploy: true,
        address: '0xaAF5aBF888d6633cAB2bb04E46EBb2FD3ba98B14',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WRAP_ETH,
        history: ['0x43C9a445fCf3bc3d1483c0b90DC0346249c0D84C'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      UnwrapEth: {
        name: 'UnwrapEth',
        deploy: true,
        address: '0xF8C44FDB83bC89FE3db2FeAE98e2732FDa469699',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.UNWRAP_ETH,
        history: ['0x7E7EB65A93441a2D2Bf0941216b4c1116B554d85'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      ReturnFunds: {
        name: 'ReturnFunds',
        deploy: true,
        address: '0x0eD12441616ca97F5729Fff519F5e8d13d8De15F',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.RETURN_FUNDS,
        history: ['0xAC0B1652388Ea425884e6b60e2eD30155f43D50b'],
        constructorArgs: [],
      },
      AaveV3Borrow: {
        name: 'AaveV3Borrow',
        deploy: true,
        address: '0x330B1b23dbF728841AF12e6478CeBb9d51ab6f90',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.BORROW,
        history: ['0x645325494A37d35cf6baFc82C3e6bcE4473F2685'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Withdraw: {
        name: 'AaveV3Withdraw',
        deploy: true,
        address: '0x98Ee526EdF6c9c3cfa1369a5D24bC2c6c278bB19',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.WITHDRAW,
        history: ['0xb3f0C5E4012aF22359c9Ab233DABd80cD81F5ec5'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Deposit: {
        name: 'AaveV3Deposit',
        deploy: true,
        address: '0x22E4CeE555C44df56ac7B85033cdE54B7439817c',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.DEPOSIT,
        history: ['0x2006d4e76A398c78964F7e311BFd7Ccb149EaFE2'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Payback: {
        name: 'AaveV3Payback',
        deploy: true,
        address: '0x3f91613F0c7f1f5940c324FfeF07632DD5793680',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.PAYBACK,
        history: ['0xA0Cb87300aB07D00468704cD8f016F8dE47D8E0A'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3SetEMode: {
        name: 'AaveV3SetEMode',
        deploy: true,
        address: '0x36a9ED9B00ECC380C4e559B80a1857C65353ce7e',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.SET_EMODE,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AjnaDepositBorrow: {
        name: 'AjnaDepositBorrow',
        deploy: true,
        address: '',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.DEPOSIT_BORROW,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AjnaRepayWithdraw: {
        name: 'AjnaRepayWithdraw',
        deploy: true,
        address: '',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.REPAY_WITHDRAW,
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
      address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.UNISWAP_ROUTER,
    },
    BalancerVault: {
      name: 'BalancerVault',
      address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.BALANCER_VAULT,
    },
    FeeRecipient: {
      name: 'FeeRecipient',
      address: '0xC7b548AD9Cf38721810246C079b2d8083aba8909',
    },
    AuthorizedCaller: {
      name: 'AuthorizedCaller',
      address: '0x85f9b7408afE6CEb5E46223451f5d4b832B522dc',
    },
    OneInchAggregator: {
      name: 'OneInchAggregator',
      address: '0x1111111254EEB25477B68fb85Ed929f73A960582',
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
      address: ADDRESS_ZERO,
    },
    ChainlinkPriceOracle_ETHUSD: {
      name: 'ChainlinkPriceOracle_ETHUSD',
      address: '0x13e3ee699d1909e989722e753853ae30b17e08c5',
    },
    SdaiOracle: {
      name: 'SdaiOracle',
      address: ADDRESS_ZERO,
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
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DAI,
    },
    ETH: { name: 'ETH', address: '0x4200000000000000000000000000000000000006' },
    FRAX: { name: 'FRAX', address: ADDRESS_ZERO },
    LUSD: { name: 'LUSD', address: ADDRESS_ZERO },
    GHO: { name: 'GHO', address: ADDRESS_ZERO },
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
    SDAI: { name: 'SDAI', address: ADDRESS_ZERO },
    STETH: { name: 'STETH', address: ADDRESS_ZERO },
    TBTC: { name: 'TBTC', address: ADDRESS_ZERO },
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
      address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.USDC,
    },
    USDBC: {
      name: 'USDBC',
      address: ADDRESS_ZERO,
    },
    USDT: { name: 'USDT', address: ADDRESS_ZERO },
    WBTC: {
      name: 'WBTC',
      address: '0x68f180fcce6836688e9084f035309e29bf0a2095',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WBTC,
    },
    WETH: {
      name: 'WETH',
      address: '0x4200000000000000000000000000000000000006',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WETH,
    },
    WLD: { name: 'WLD', address: ADDRESS_ZERO },
    WSTETH: {
      name: 'WSTETH',
      address: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WSTETH,
    },
    YIELDBTC: {
      name: 'YIELDBTC',
      address: ADDRESS_ZERO,
    },
    YIELDETH: {
      name: 'YIELDETH',
      address: ADDRESS_ZERO,
    },
    YFI: { name: 'YFI', address: ADDRESS_ZERO },
    ZRX: { name: 'ZRX', address: ADDRESS_ZERO },
  },
  aave: {
    v2: {
      Oracle: {
        name: 'Oracle',
        address: ADDRESS_ZERO,
      },
      LendingPool: {
        name: 'LendingPool',
        address: ADDRESS_ZERO,
      },
      PoolDataProvider: {
        name: 'PoolDataProvider',
        address: ADDRESS_ZERO,
      },
      WETHGateway: {
        name: 'WETHGateway',
        address: ADDRESS_ZERO,
      },
    },
    v3: {
      Oracle: {
        name: 'Oracle',
        address: '0xD81eb3728a631871a7eBBaD631b5f424909f0c77',
      },
      LendingPool: {
        name: 'LendingPool',
        address: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.AAVE_POOL,
      },
      PoolDataProvider: {
        name: 'PoolDataProvider',
        address: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
      },
      L2Encoder: {
        name: 'L2Encoder',
        address: '0x9abADECD08572e0eA5aF4d47A9C7984a5AA503dC',
      },
    },
  },
  spark: {},
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
      address: '0x0000000000000000000000000000000000000000',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.AJNA_POOL_UTILS_INFO,
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
    AjnaPoolPairs_USDCETH: {
      name: 'AjnaPoolPairs_USDCETH',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_USDCDAI: { name: 'AjnaPoolPairs_USDCDAI', address: '' },
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
      name: 'AjnaPoolPairs_WSTETHETH',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_WSTETHUSDC: {
      name: 'AjnaPoolPairs_WSTETHUSDC',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_CBETHETH: {
      name: 'AjnaPoolPairs_CBETHETH',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_TBTCWBTC: {
      name: 'AjnaPoolPairs_TBTCWBTC',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_TBTCUSDC: {
      name: 'AjnaPoolPairs_TBTCUSDC',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_ETHGHO: {
      name: 'AjnaPoolPairs_ETHGHO',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_WSTETHGHO: {
      name: 'AjnaPoolPairs_WSTETHGHO',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_GHODAI: {
      name: 'AjnaPoolPairs_GHODAI',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_RETHGHO: {
      name: 'AjnaPoolPairs_RETHGHO',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_WBTCGHO: {
      name: 'AjnaPoolPairs_WBTCGHO',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_CBETHGHO: {
      name: 'AjnaPoolPairs_CBETHGHO',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_WLDUSDC: {
      name: 'AjnaPoolPairs_WLDUSDC',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_USDCWLD: {
      name: 'AjnaPoolPairs_USDCWLD',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_SDAIUSDC: {
      name: 'AjnaPoolPairs_SDAIUSDC',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_YFIDAI: {
      name: 'AjnaPoolPairs_YFIDAI',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_YIELDETHETH: {
      name: 'AjnaPoolPairs_YIELDETHETH',
      address: ADDRESS_ZERO,
    },
    AjnaPoolPairs_YIELDBTCWBTC: {
      name: 'AjnaPoolPairs_YIELDBTCWBTC',
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
    ERC20PoolFactory: {
      name: 'ERC20PoolFactory',
      address: '0x0000000000000000000000000000000000000000',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.ERC20_POOL_FACTORY,
    },
  },
  morphoblue: {
    MorphoBlue: {
      name: 'MorphoBlue',
      address: '0x0000000000000000000000000000000000000000',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.MORPHO_BLUE,
    },
  },
}
