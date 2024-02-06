import { loadContractNames } from '@deploy-configurations/constants'
import { SystemConfig } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'

const SERVICE_REGISTRY_NAMES = loadContractNames(Network.ARBITRUM)

export const config: SystemConfig = {
  mpa: {
    core: {
      ServiceRegistry: {
        name: 'ServiceRegistry',
        deploy: true,
        address: '0x85859Ab683019a4E345D963E455B5e3Ce133Ef49',
        history: [],
        constructorArgs: [ 0 ]
      },
      OperationsRegistry: {
        name: 'OperationsRegistry',
        deploy: true,
        address: '0x3637DF43F938b05A71bb828f13D9f14498E6883c',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATIONS_REGISTRY,
        history: [
          '0x53B1f1B3f34b5B3C7dA8BD60a7E8ee2eFd175603',
          '0x392ACeBea829373A3eFDc0dA80a16003106d8f6E'
        ],
        constructorArgs: []
      },
      OperationExecutor: {
        name: 'OperationExecutor',
        deploy: true,
        address: '0x50241265F81a568a536a205F1F4bea8899Df9eFe',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATION_EXECUTOR,
        history: [
          '0xa7840fa682506117F4549E918930C80c1FC3A46c',
          '0x90feaf7727a6ce75f518728d296877830fd39a49',
          '0xa7840fa682506117F4549E918930C80c1FC3A46c'
        ],
        constructorArgs: [
          'address:ServiceRegistry',
          'address:OperationsRegistry',
          '0x0000000000000000000000000000000000000000',
          '0xBA12222222228d8Ba445958a75a0704d566BF2C8'
        ]
      },
      OperationStorage: {
        name: 'OperationStorage',
        deploy: true,
        address: '0x77f36e80BC366E6C13Cc7e8e1EB5dF8190D2bD8e',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATION_STORAGE,
        history: [
          '0x28cd581B0F96BC046f461cAE9BBd7303fA0fF8e6',
          '0xd4FEaf1023CD6998053a1eb02460000980Cc908f',
          '0x28cd581B0F96BC046f461cAE9BBd7303fA0fF8e6'
        ],
        constructorArgs: [ 'address:ServiceRegistry', 'address:OperationExecutor' ]
      },
      DSProxyFactory: {
        name: 'DSProxyFactory',
        deploy: false,
        address: '0x63059cC2533344B65372983D4B6258b2cbbBF0Da',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_PROXY_FACTORY,
        history: [],
        constructorArgs: []
      },
      DSProxyRegistry: {
        name: 'DSProxyRegistry',
        deploy: false,
        address: '0x9319710C25cdaDDD1766F0bDE40F1A4034C17c7e',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_PROXY_REGISTRY,
        history: [],
        constructorArgs: [ 'address:DSProxyFactory' ]
      },
      DSGuardFactory: {
        name: 'DSGuardFactory',
        deploy: false,
        address: '0x98C7C60924170B709D1a8aA6Fbb443190E3296CD',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_GUARD_FACTORY,
        history: [],
        constructorArgs: []
      },
      AccountGuard: {
        name: 'AccountGuard',
        deploy: false,
        address: '0x746a6f9Acb42bcB43C08C829A035DBa7Db9E7385',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ACCOUNT_GUARD,
        history: [],
        constructorArgs: []
      },
      AccountFactory: {
        name: 'AccountFactory',
        deploy: false,
        address: '0xCcB155E5B2A3201d5e10EdAa6e9F908871d1722B',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ACCOUNT_FACTORY,
        history: [],
        constructorArgs: [ 'address:AccountGuard' ]
      },
      Swap: {
        name: 'Swap',
        deploy: true,
        address: '0x03644F489Bf16B1eAFa68F495955eb5a78189314',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SWAP,
        history: [ '0x6166B1587be6B954e660A71e4B083A5e0a5bF1b6' ],
        constructorArgs: [
          '0x0B5a3C04D1199283938fbe887A2C82C808aa89Fb',
          '0x67e30ba093148e835f47Fd5dcf1AF7D0c58E0f6b',
          20,
          'address:ServiceRegistry'
        ]
      }
    },
    actions: {
      PositionCreated: {
        name: 'PositionCreated',
        deploy: false,
        address: '0xeB54C366512c4d59A222A251ea7316568859E08C',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.POSITION_CREATED,
        history: [],
        constructorArgs: []
      },
      SwapAction: {
        name: 'SwapAction',
        deploy: true,
        address: '0x1b5A437A706778C14C0a4572e27A4bb9D94273f5',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SWAP_ACTION,
        history: [
          '0x31d767f6556CE3fC55d6245C9aEF3575aa64BABf',
          '0x43C9a445fCf3bc3d1483c0b90DC0346249c0D84C'
        ],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      TakeFlashloan: {
        name: 'TakeFlashloan',
        deploy: true,
        address: '0x23692677cC33D54C18Fe9F11759601f68f7b257f',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.TAKE_A_FLASHLOAN,
        history: [
          '0xf309EE5603bF05E5614dB930E4EAB661662aCeE6',
          '0x7E7EB65A93441a2D2Bf0941216b4c1116B554d85'
        ],
        constructorArgs: [
          'address:ServiceRegistry',
          '0x0000000000000000000000000000000000000000',
          'address:DSGuardFactory'
        ]
      },
      TakeFlashloanBalancer: {
        name: 'TakeFlashloanBalancer',
        deploy: true,
        address: '0x6dbf22F77C8a50043E65963EF79C2Dab0E76F6C3',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.TAKE_A_FLASHLOAN_BALANCER,
        history: [
          '0xF48e55b1c2D0080E89F12c34452A6298BB397A4C',
          '0x2a35D123111ea15cabD125A0e2Faf42bC58e76D3'
        ],
        constructorArgs: [
          'address:ServiceRegistry',
          '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
          'address:DSGuardFactory'
        ]
      },
      SetApproval: {
        name: 'SetApproval',
        deploy: true,
        address: '0xe518B0ceCC56F705788545C51F04f49d1FDCa5cB',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SET_APPROVAL,
        history: [
          '0x1c98d87b245aA442791Ffb8a7e57380Ed49112FF',
          '0xAC0B1652388Ea425884e6b60e2eD30155f43D50b'
        ],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      PullToken: {
        name: 'PullToken',
        deploy: true,
        address: '0x2007f5e3b6734d16A425182c3DF0995993FeBC3C',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.PULL_TOKEN,
        history: [
          '0x645325494A37d35cf6baFc82C3e6bcE4473F2685',
          '0x039F7784C5A6f187fcAc027262aA912974A7515D'
        ],
        constructorArgs: []
      },
      SendToken: {
        name: 'SendToken',
        deploy: true,
        address: '0x8c9Cc9646c5588247Ef8B3A63BdfA2d2441E9a9D',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SEND_TOKEN,
        history: [
          '0xb3f0C5E4012aF22359c9Ab233DABd80cD81F5ec5',
          '0x508E30f983d8a2F75154f7515f1163a7dE94C5A5'
        ],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      WrapEth: {
        name: 'WrapEth',
        deploy: true,
        address: '0xAA777F9A6a31ad862D688a6789c393014dA59770',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WRAP_ETH,
        history: [
          '0x2006d4e76A398c78964F7e311BFd7Ccb149EaFE2',
          '0x099708408aDb18F6D49013c88F3b1Bb514cC616F'
        ],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      UnwrapEth: {
        name: 'UnwrapEth',
        deploy: true,
        address: '0xfff30C67EEa809123596252e132d30e1EB75BC83',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.UNWRAP_ETH,
        history: [
          '0xA0Cb87300aB07D00468704cD8f016F8dE47D8E0A',
          '0x74d4B9e8350c5aFC6c01bb725dA28053D2420FB1'
        ],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      ReturnFunds: {
        name: 'ReturnFunds',
        deploy: false,
        address: '0xFb5896f0485877cC0cc4eBF74d98D064f9A46462',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.RETURN_FUNDS,
        history: [ '0x063E4242CD7C2421f67e21D7297c74bbDFEF7b0E' ],
        constructorArgs: []
      },
      AaveV3Borrow: {
        name: 'AaveV3Borrow',
        deploy: true,
        address: '0x184401060DC438e411F4a4Fd5F4076a05C358bBB',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.BORROW,
        history: [
          '0xe1D974cAB854a65b2005A1cbF9D627D90DAb70c2',
          '0x28c52DA0482776e2e4427Ca55818522E7033592e'
        ],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      AaveV3Withdraw: {
        name: 'AaveV3Withdraw',
        deploy: true,
        address: '0x05C2292528694b4030A766c47e9F2bE525b4e8BC',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.WITHDRAW,
        history: [
          '0xCe91349d2A4577BBd0fC91Fe6019600e047f2847',
          '0x4C020189Ed0556bD934F6d459003c95706b2D71d'
        ],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      AaveV3WithdrawAuto: {
        name: 'AaveV3WithdrawAuto',
        deploy: true,
        address: '0xf7c7168b965215420E15cDE6F7e54570Ec171D67',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.WITHDRAW_AUTO,
        history: [
          '',
          '0x601a8F7EA34168D912fB3C214a377CB544F18c0d',
          '0x601a8F7EA34168D912fB3C214a377CB544F18c0d',
          '0x7a4963548794247FeECC8cf766eC8AA3f169F452'
        ],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      AaveV3Deposit: {
        name: 'AaveV3Deposit',
        deploy: true,
        address: '0xb2b872d285EECfc999002594f695d08A67889513',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.DEPOSIT,
        history: [
          '0xbCC3813520bCCd64d55CEA370948198EDFB03ee3',
          '0x595e9375bF40f2B9112c21b3Ded4e06cF3641982'
        ],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      AaveV3Payback: {
        name: 'AaveV3Payback',
        deploy: true,
        address: '0x8CcB5D70D4E8110312ddd6a64fE79FcD01e11B20',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.PAYBACK,
        history: [
          '0xF7B75183A2829843dB06266c114297dfbFaeE2b6',
          '0x3C407ea1ceDA073adF1b8472648FCD8b5400132a'
        ],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      AaveV3SetEMode: {
        name: 'AaveV3SetEMode',
        deploy: true,
        address: '0x32Dae0AD2A6D9813854ad085d71932Ed409EF265',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.SET_EMODE,
        history: [
          '0x71B16bF494a868a632189324e219470d2cD46863',
          '0x211131b23d07115030b51dFd8922bE5A23fd09E2'
        ],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      AjnaDepositBorrow: {
        name: 'AjnaDepositBorrow',
        deploy: false,
        address: '',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.DEPOSIT_BORROW,
        history: [],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      AjnaRepayWithdraw: {
        name: 'AjnaRepayWithdraw',
        deploy: false,
        address: '',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.REPAY_WITHDRAW,
        history: [],
        constructorArgs: [ 'address:ServiceRegistry' ]
      }
    }
  },
  common: {
    GnosisSafe: { name: 'GnosisSafe', address: '' },
    UniswapRouterV3: {
      name: 'UniswapRouterV3',
      address: '0xe592427a0aece92de3edee1f18e0157c05861564',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.UNISWAP_ROUTER
    },
    BalancerVault: {
      name: 'BalancerVault',
      address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.BALANCER_VAULT
    },
    FeeRecipient: { name: 'FeeRecipient', address: '' },
    AuthorizedCaller: { name: 'AuthorizedCaller', address: '' },
    OneInchAggregator: {
      name: 'OneInchAggregator',
      address: '0x1111111254EEB25477B68fb85Ed929f73A960582',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ONE_INCH_AGGREGATOR
    },
    MerkleRedeemer: { name: 'MerkleRedeemer', address: '' },
    DssCharter: { name: 'DssCharter', address: '' },
    DssProxyActions: { name: 'DssProxyActions', address: '' },
    DssProxyActionsCharter: { name: 'DssProxyActionsCharter', address: '' },
    DssMultiplyProxyActions: { name: 'DssMultiplyProxyActions', address: '' },
    DssCropper: { name: 'DssCropper', address: '' },
    DssProxyActionsCropjoin: { name: 'DssProxyActionsCropjoin', address: '' },
    DssProxyActionsDsr: { name: 'DssProxyActionsDsr', address: '' },
    Otc: { name: 'Otc', address: '' },
    OtcSupportMethods: { name: 'OtcSupportMethods', address: '' },
    ServiceRegistry: { name: 'ServiceRegistry', address: '' },
    GuniProxyActions: { name: 'GuniProxyActions', address: '' },
    GuniResolver: { name: 'GuniResolver', address: '' },
    GuniRouter: { name: 'GuniRouter', address: '' },
    CdpRegistry: { name: 'CdpRegistry', address: '' },
    DefaultExchange: { name: 'DefaultExchange', address: '' },
    NoFeesExchange: { name: 'NoFeesExchange', address: '' },
    LowerFeesExchange: { name: 'LowerFeesExchange', address: '' },
    LidoCrvLiquidityFarmingReward: { name: 'LidoCrvLiquidityFarmingReward', address: '' },
    ChainlinkPriceOracle_USDCUSD: {
      name: 'ChainlinkPriceOracle_USDCUSD',
      address: '0x50834f3163758fcc1df9973b6e91f0f0f0434ad3'
    },
    ChainlinkPriceOracle_ETHUSD: {
      name: 'ChainlinkPriceOracle_ETHUSD',
      address: '0x639fe6ab55c921f74e7fac1ee960c0b6293ba612'
    },
    ADAI: {
      name: 'ADAI',
      address: '0x0000000000000000000000000000000000000000'
    },
    AAVE: {
      name: 'AAVE',
      address: '0x0000000000000000000000000000000000000000'
    },
    BAL: {
      name: 'BAL',
      address: '0x0000000000000000000000000000000000000000'
    },
    BAT: {
      name: 'BAT',
      address: '0x0000000000000000000000000000000000000000'
    },
    CBETH: {
      name: 'CBETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    COMP: {
      name: 'COMP',
      address: '0x0000000000000000000000000000000000000000'
    },
    CRVV1ETHSTETH: {
      name: 'CRVV1ETHSTETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    DAI: {
      name: 'DAI',
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DAI
    },
    ETH: {
      name: 'ETH',
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
    },
    FRAX: {
      name: 'FRAX',
      address: '0x0000000000000000000000000000000000000000'
    },
    GNO: {
      name: 'GNO',
      address: '0x0000000000000000000000000000000000000000'
    },
    GUNIV3DAIUSDC1: { name: 'GUNIV3DAIUSDC1', address: '' },
    GUNIV3DAIUSDC2: { name: 'GUNIV3DAIUSDC2', address: '' },
    GUSD: {
      name: 'GUSD',
      address: '0x0000000000000000000000000000000000000000'
    },
    KNC: {
      name: 'KNC',
      address: '0x0000000000000000000000000000000000000000'
    },
    LDO: {
      name: 'LDO',
      address: '0x0000000000000000000000000000000000000000'
    },
    LINK: {
      name: 'LINK',
      address: '0x0000000000000000000000000000000000000000'
    },
    LRC: {
      name: 'LRC',
      address: '0x0000000000000000000000000000000000000000'
    },
    LUSD: {
      name: 'LUSD',
      address: '0x0000000000000000000000000000000000000000'
    },
    MANA: {
      name: 'MANA',
      address: '0x0000000000000000000000000000000000000000'
    },
    MATIC: {
      name: 'MATIC',
      address: '0x0000000000000000000000000000000000000000'
    },
    PAX: {
      name: 'PAX',
      address: '0x0000000000000000000000000000000000000000'
    },
    PAXUSD: {
      name: 'PAXUSD',
      address: '0x0000000000000000000000000000000000000000'
    },
    RENBTC: {
      name: 'RENBTC',
      address: '0x0000000000000000000000000000000000000000'
    },
    RETH: {
      name: 'RETH',
      address: '0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8'
    },
    RWA001: {
      name: 'RWA001',
      address: '0x0000000000000000000000000000000000000000'
    },
    RWA002: {
      name: 'RWA002',
      address: '0x0000000000000000000000000000000000000000'
    },
    RWA003: {
      name: 'RWA003',
      address: '0x0000000000000000000000000000000000000000'
    },
    RWA004: {
      name: 'RWA004',
      address: '0x0000000000000000000000000000000000000000'
    },
    RWA005: {
      name: 'RWA005',
      address: '0x0000000000000000000000000000000000000000'
    },
    RWA006: {
      name: 'RWA006',
      address: '0x0000000000000000000000000000000000000000'
    },
    GHO: {
      name: 'GHO',
      address: '0x0000000000000000000000000000000000000000'
    },
    TUSD: {
      name: 'TUSD',
      address: '0x0000000000000000000000000000000000000000'
    },
    SdaiOracle: {
      name: 'SdaiOracle',
      address: '0x0000000000000000000000000000000000000000'
    },
    SDAI: {
      name: 'SDAI',
      address: '0x0000000000000000000000000000000000000000'
    },
    STETH: {
      name: 'STETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    TBTC: {
      name: 'TBTC',
      address: '0x0000000000000000000000000000000000000000'
    },
    UNI: {
      name: 'UNI',
      address: '0x0000000000000000000000000000000000000000'
    },
    UNIV2AAVEETH: {
      name: 'UNIV2AAVEETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    UNIV2DAIETH: {
      name: 'UNIV2DAIETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    UNIV2DAIUSDC: {
      name: 'UNIV2DAIUSDC',
      address: '0x0000000000000000000000000000000000000000'
    },
    UNIV2DAIUSDT: {
      name: 'UNIV2DAIUSDT',
      address: '0x0000000000000000000000000000000000000000'
    },
    UNIV2ETHUSDT: {
      name: 'UNIV2ETHUSDT',
      address: '0x0000000000000000000000000000000000000000'
    },
    UNIV2LINKETH: {
      name: 'UNIV2LINKETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    UNIV2UNIETH: {
      name: 'UNIV2UNIETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    UNIV2USDCETH: {
      name: 'UNIV2USDCETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    UNIV2WBTCDAI: {
      name: 'UNIV2WBTCDAI',
      address: '0x0000000000000000000000000000000000000000'
    },
    UNIV2WBTCETH: {
      name: 'UNIV2WBTCETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    USDC: {
      name: 'USDC',
      address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.USDC
    },
    USDBC: {
      name: 'USDBC',
      address: '0x0000000000000000000000000000000000000000'
    },
    USDT: {
      name: 'USDT',
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
    },
    WBTC: {
      name: 'WBTC',
      address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WBTC
    },
    WETH: {
      name: 'WETH',
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WETH
    },
    WLD: {
      name: 'WLD',
      address: '0x0000000000000000000000000000000000000000'
    },
    WSTETH: {
      name: 'WSTETH',
      address: '0x5979D7b546E38E414F7E9822514be443A4800529',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WSTETH
    },
    YIELDBTC: {
      name: 'YIELDBTC',
      address: '0x0000000000000000000000000000000000000000'
    },
    YIELDETH: {
      name: 'YIELDETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    YFI: {
      name: 'YFI',
      address: '0x0000000000000000000000000000000000000000'
    },
    ZRX: {
      name: 'ZRX',
      address: '0x0000000000000000000000000000000000000000'
    }
  },
  aave: {
    v2: {
      Oracle: { name: 'Oracle', address: '' },
      LendingPool: { name: 'LendingPool', address: '' },
      PoolDataProvider: { name: 'PoolDataProvider', address: '' },
      WETHGateway: { name: 'WETHGateway', address: '' }
    },
    v3: {
      Oracle: {
        name: 'Oracle',
        address: '0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7'
      },
      LendingPool: {
        name: 'LendingPool',
        address: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.AAVE_POOL
      },
      PoolDataProvider: {
        name: 'PoolDataProvider',
        address: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654'
      },
      L2Encoder: {
        name: 'L2Encoder',
        address: '0x9abADECD08572e0eA5aF4d47A9C7984a5AA503dC'
      }
    }
  },
  spark: {},
  maker: {
    common: {
      FlashMintModule: { name: 'FlashMintModule', address: '' },
      Chainlog: { name: 'Chainlog', address: '' },
      CdpManager: { name: 'CdpManager', address: '' },
      GetCdps: { name: 'GetCdps', address: '' },
      Jug: { name: 'Jug', address: '' },
      Pot: { name: 'Pot', address: '' },
      End: { name: 'End', address: '' },
      Spot: { name: 'Spot', address: '' },
      Dog: { name: 'Dog', address: '' },
      Vat: { name: 'Vat', address: '' },
      McdGov: { name: 'McdGov', address: '' }
    },
    joins: {
      MCD_JOIN_DAI: { name: 'MCD_JOIN_DAI', address: '' },
      MCD_JOIN_ETH_A: { name: 'MCD_JOIN_ETH_A', address: '' },
      MCD_JOIN_ETH_B: { name: 'MCD_JOIN_ETH_B', address: '' },
      MCD_JOIN_ETH_C: { name: 'MCD_JOIN_ETH_C', address: '' },
      MCD_JOIN_BAT_A: { name: 'MCD_JOIN_BAT_A', address: '' },
      MCD_JOIN_USDC_A: { name: 'MCD_JOIN_USDC_A', address: '' },
      MCD_JOIN_USDC_B: { name: 'MCD_JOIN_USDC_B', address: '' },
      MCD_JOIN_PSM_USDC_A: { name: 'MCD_JOIN_PSM_USDC_A', address: '' },
      MCD_JOIN_TUSD_A: { name: 'MCD_JOIN_TUSD_A', address: '' },
      MCD_JOIN_WBTC_A: { name: 'MCD_JOIN_WBTC_A', address: '' },
      MCD_JOIN_WBTC_B: { name: 'MCD_JOIN_WBTC_B', address: '' },
      MCD_JOIN_WBTC_C: { name: 'MCD_JOIN_WBTC_C', address: '' },
      MCD_JOIN_ZRX_A: { name: 'MCD_JOIN_ZRX_A', address: '' },
      MCD_JOIN_KNC_A: { name: 'MCD_JOIN_KNC_A', address: '' },
      MCD_JOIN_MANA_A: { name: 'MCD_JOIN_MANA_A', address: '' },
      MCD_JOIN_USDT_A: { name: 'MCD_JOIN_USDT_A', address: '' },
      MCD_JOIN_PAXUSD_A: { name: 'MCD_JOIN_PAXUSD_A', address: '' },
      MCD_JOIN_PSM_PAX_A: { name: 'MCD_JOIN_PSM_PAX_A', address: '' },
      MCD_JOIN_COMP_A: { name: 'MCD_JOIN_COMP_A', address: '' },
      MCD_JOIN_LRC_A: { name: 'MCD_JOIN_LRC_A', address: '' },
      MCD_JOIN_LINK_A: { name: 'MCD_JOIN_LINK_A', address: '' },
      MCD_JOIN_BAL_A: { name: 'MCD_JOIN_BAL_A', address: '' },
      MCD_JOIN_YFI_A: { name: 'MCD_JOIN_YFI_A', address: '' },
      MCD_JOIN_GUSD_A: { name: 'MCD_JOIN_GUSD_A', address: '' },
      MCD_JOIN_PSM_GUSD_A: { name: 'MCD_JOIN_PSM_GUSD_A', address: '' },
      MCD_JOIN_UNI_A: { name: 'MCD_JOIN_UNI_A', address: '' },
      MCD_JOIN_RENBTC_A: { name: 'MCD_JOIN_RENBTC_A', address: '' },
      MCD_JOIN_AAVE_A: { name: 'MCD_JOIN_AAVE_A', address: '' },
      MCD_JOIN_MATIC_A: { name: 'MCD_JOIN_MATIC_A', address: '' },
      MCD_JOIN_WSTETH_A: { name: 'MCD_JOIN_WSTETH_A', address: '' },
      MCD_JOIN_WSTETH_B: { name: 'MCD_JOIN_WSTETH_B', address: '' },
      MCD_JOIN_UNIV2DAIETH_A: { name: 'MCD_JOIN_UNIV2DAIETH_A', address: '' },
      MCD_JOIN_UNIV2WBTCETH_A: { name: 'MCD_JOIN_UNIV2WBTCETH_A', address: '' },
      MCD_JOIN_UNIV2USDCETH_A: { name: 'MCD_JOIN_UNIV2USDCETH_A', address: '' },
      MCD_JOIN_UNIV2DAIUSDC_A: { name: 'MCD_JOIN_UNIV2DAIUSDC_A', address: '' },
      MCD_JOIN_UNIV2ETHUSDT_A: { name: 'MCD_JOIN_UNIV2ETHUSDT_A', address: '' },
      MCD_JOIN_UNIV2LINKETH_A: { name: 'MCD_JOIN_UNIV2LINKETH_A', address: '' },
      MCD_JOIN_UNIV2UNIETH_A: { name: 'MCD_JOIN_UNIV2UNIETH_A', address: '' },
      MCD_JOIN_UNIV2WBTCDAI_A: { name: 'MCD_JOIN_UNIV2WBTCDAI_A', address: '' },
      MCD_JOIN_UNIV2AAVEETH_A: { name: 'MCD_JOIN_UNIV2AAVEETH_A', address: '' },
      MCD_JOIN_UNIV2DAIUSDT_A: { name: 'MCD_JOIN_UNIV2DAIUSDT_A', address: '' },
      MCD_JOIN_RWA001_A: { name: 'MCD_JOIN_RWA001_A', address: '' },
      MCD_JOIN_RWA002_A: { name: 'MCD_JOIN_RWA002_A', address: '' },
      MCD_JOIN_RWA003_A: { name: 'MCD_JOIN_RWA003_A', address: '' },
      MCD_JOIN_RWA004_A: { name: 'MCD_JOIN_RWA004_A', address: '' },
      MCD_JOIN_RWA005_A: { name: 'MCD_JOIN_RWA005_A', address: '' },
      MCD_JOIN_RWA006_A: { name: 'MCD_JOIN_RWA006_A', address: '' },
      MCD_JOIN_RETH_A: { name: 'MCD_JOIN_RETH_A', address: '' },
      MCD_JOIN_GNO_A: { name: 'MCD_JOIN_GNO_A', address: '' },
      MCD_JOIN_DIRECT_AAVEV2_DAI: { name: 'MCD_JOIN_DIRECT_AAVEV2_DAI', address: '' },
      MCD_JOIN_GUNIV3DAIUSDC1_A: { name: 'MCD_JOIN_GUNIV3DAIUSDC1_A', address: '' },
      MCD_JOIN_GUNIV3DAIUSDC2_A: { name: 'MCD_JOIN_GUNIV3DAIUSDC2_A', address: '' },
      MCD_JOIN_CRVV1ETHSTETH_A: { name: 'MCD_JOIN_CRVV1ETHSTETH_A', address: '' }
    },
    pips: {
      PIP_ETH: { name: 'PIP_ETH', address: '' },
      PIP_BAT: { name: 'PIP_BAT', address: '' },
      PIP_USDC: { name: 'PIP_USDC', address: '' },
      PIP_WBTC: { name: 'PIP_WBTC', address: '' },
      PIP_TUSD: { name: 'PIP_TUSD', address: '' },
      PIP_ZRX: { name: 'PIP_ZRX', address: '' },
      PIP_KNC: { name: 'PIP_KNC', address: '' },
      PIP_MANA: { name: 'PIP_MANA', address: '' },
      PIP_USDT: { name: 'PIP_USDT', address: '' },
      PIP_PAXUSD: { name: 'PIP_PAXUSD', address: '' },
      PIP_PAX: { name: 'PIP_PAX', address: '' },
      PIP_COMP: { name: 'PIP_COMP', address: '' },
      PIP_LRC: { name: 'PIP_LRC', address: '' },
      PIP_LINK: { name: 'PIP_LINK', address: '' },
      PIP_BAL: { name: 'PIP_BAL', address: '' },
      PIP_YFI: { name: 'PIP_YFI', address: '' },
      PIP_GUSD: { name: 'PIP_GUSD', address: '' },
      PIP_UNI: { name: 'PIP_UNI', address: '' },
      PIP_RENBTC: { name: 'PIP_RENBTC', address: '' },
      PIP_AAVE: { name: 'PIP_AAVE', address: '' },
      PIP_MATIC: { name: 'PIP_MATIC', address: '' },
      PIP_WSTETH: { name: 'PIP_WSTETH', address: '' },
      PIP_ADAI: { name: 'PIP_ADAI', address: '' },
      PIP_UNIV2DAIETH: { name: 'PIP_UNIV2DAIETH', address: '' },
      PIP_UNIV2WBTCETH: { name: 'PIP_UNIV2WBTCETH', address: '' },
      PIP_UNIV2USDCETH: { name: 'PIP_UNIV2USDCETH', address: '' },
      PIP_UNIV2DAIUSDC: { name: 'PIP_UNIV2DAIUSDC', address: '' },
      PIP_UNIV2ETHUSDT: { name: 'PIP_UNIV2ETHUSDT', address: '' },
      PIP_UNIV2LINKETH: { name: 'PIP_UNIV2LINKETH', address: '' },
      PIP_UNIV2UNIETH: { name: 'PIP_UNIV2UNIETH', address: '' },
      PIP_UNIV2WBTCDAI: { name: 'PIP_UNIV2WBTCDAI', address: '' },
      PIP_UNIV2AAVEETH: { name: 'PIP_UNIV2AAVEETH', address: '' },
      PIP_UNIV2DAIUSDT: { name: 'PIP_UNIV2DAIUSDT', address: '' },
      PIP_GUNIV3DAIUSDC1: { name: 'PIP_GUNIV3DAIUSDC1', address: '' },
      PIP_GUNIV3DAIUSDC2: { name: 'PIP_GUNIV3DAIUSDC2', address: '' },
      PIP_CRVV1ETHSTETH: { name: 'PIP_CRVV1ETHSTETH', address: '' },
      PIP_RWA001: { name: 'PIP_RWA001', address: '' },
      PIP_RWA002: { name: 'PIP_RWA002', address: '' },
      PIP_RWA003: { name: 'PIP_RWA003', address: '' },
      PIP_RWA004: { name: 'PIP_RWA004', address: '' },
      PIP_RWA005: { name: 'PIP_RWA005', address: '' },
      PIP_RWA006: { name: 'PIP_RWA006', address: '' },
      PIP_RETH: { name: 'PIP_RETH', address: '' },
      PIP_GNO: { name: 'PIP_GNO', address: '' },
      PIP_WETH: { name: 'PIP_WETH', address: '' }
    }
  },
  automation: {
    AutomationBot: { name: 'AutomationBot', address: '' },
    AutomationBotV2: {
      name: 'AutomationBotV2',
      address: '0xEece0010A715bA9c46E0F4fc53b3DA5988e5F043'
    },
    AutomationBotAggregator: { name: 'AutomationBotAggregator', address: '' }
  },
  ajna: {
    AjnaPoolInfo: {
      name: 'AjnaPoolInfo',
      address: '0x0000000000000000000000000000000000000000',
      serviceRegistryName: undefined
    },
    AjnaProxyActions: {
      name: 'AjnaProxyActions',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_ETHDAI: {
      name: 'AjnaPoolPairs_ETHDAI',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_ETHUSDC: {
      name: 'AjnaPoolPairs_ETHUSDC',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_RETHDAI: {
      name: 'AjnaPoolPairs_RETHDAI',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_RETHETH: {
      name: 'AjnaPoolPairs_RETHETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_RETHUSDC: {
      name: 'AjnaPoolPairs_RETHUSDC',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_USDCETH: {
      name: 'AjnaPoolPairs_USDCETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_USDCWBTC: {
      name: 'AjnaPoolPairs_USDCWBTC',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_USDCDAI: { name: 'AjnaPoolPairs_USDCDAI', address: '' },
    AjnaPoolPairs_WBTCDAI: {
      name: 'AjnaPoolPairs_WBTCDAI',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_WBTCUSDC: {
      name: 'AjnaPoolPairs_WBTCUSDC',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_WSTETHDAI: {
      name: 'AjnaPoolPairs_WSTETHDAI',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_WSTETHETH: {
      name: 'AjnaPoolPairs_WSTETHETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_WSTETHUSDC: {
      name: 'AjnaPoolPairs_WSTETHUSDC',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_CBETHETH: {
      name: 'AjnaPoolPairs_CBETHETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_TBTCWBTC: {
      name: 'AjnaPoolPairs_TBTCWBTC',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_TBTCUSDC: {
      name: 'AjnaPoolPairs_TBTCUSDC',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_ETHGHO: {
      name: 'AjnaPoolPairs_ETHGHO',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_WSTETHGHO: {
      name: 'AjnaPoolPairs_WSTETHGHO',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_GHODAI: {
      name: 'AjnaPoolPairs_GHODAI',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_RETHGHO: {
      name: 'AjnaPoolPairs_RETHGHO',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_WBTCGHO: {
      name: 'AjnaPoolPairs_WBTCGHO',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_CBETHGHO: {
      name: 'AjnaPoolPairs_CBETHGHO',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_WLDUSDC: {
      name: 'AjnaPoolPairs_WLDUSDC',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_USDCWLD: {
      name: 'AjnaPoolPairs_USDCWLD',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_SDAIUSDC: {
      name: 'AjnaPoolPairs_SDAIUSDC',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_YFIDAI: {
      name: 'AjnaPoolPairs_YFIDAI',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_YIELDETHETH: {
      name: 'AjnaPoolPairs_YIELDETHETH',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaPoolPairs_YIELDBTCWBTC: {
      name: 'AjnaPoolPairs_YIELDBTCWBTC',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaRewardsManager: {
      name: 'AjnaRewardsManager',
      address: '0x0000000000000000000000000000000000000000'
    },
    AjnaRewardsClaimer: {
      name: 'AjnaRewardsClaimer',
      address: '0x0000000000000000000000000000000000000000'
    },
    ERC20PoolFactory: {
      name: 'ERC20PoolFactory',
      address: '0x0000000000000000000000000000000000000000',
      serviceRegistryName: undefined
    }
  },
  morphoblue: {
    MorphoBlue: {
      name: 'MorphoBlue',
      address: '0x0000000000000000000000000000000000000000',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.MORPHO_BLUE
    }
  }
}