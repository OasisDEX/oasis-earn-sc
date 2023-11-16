import { Network } from '@deploy-configurations/types/network'

import { ADDRESS_ZERO, loadContractNames } from '../constants'
import { SystemConfig } from '../types/deployment-config'

const SERVICE_REGISTRY_NAMES = loadContractNames(Network.GOERLI)

export const config: SystemConfig = {
  mpa: {
    core: {
      ServiceRegistry: {
        name: 'ServiceRegistry',
        deploy: false,
        address: '0x73024Ec24c03904A4b5FBfa249B410891C12407b',
        history: [],
        constructorArgs: [0],
      },
      OperationExecutor: {
        name: 'OperationExecutor',
        deploy: true,
        address: '0xA946f00b58a934824215C1D91346AebbD8702FD4',
        serviceRegistryName: 'OperationExecutor_2',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      OperationStorage: {
        name: 'OperationStorage',
        deploy: false,
        address: '',
        serviceRegistryName: 'OperationStorage_2',
        history: [],
        constructorArgs: ['address:ServiceRegistry', 'address:OperationExecutor'],
      },
      OperationsRegistry: {
        name: 'OperationsRegistry',
        deploy: false,
        address: '',
        serviceRegistryName: 'OperationsRegistry_2',
        history: [],
        constructorArgs: [],
      },
      DSProxyFactory: {
        name: 'DSProxyFactory',
        deploy: false,
        address: '0x84eFB9c18059394172D0d69A3E58B03320001871',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_PROXY_FACTORY,
        history: [],
        constructorArgs: [],
      },
      DSProxyRegistry: {
        name: 'DSProxyRegistry',
        deploy: false,
        address: '0x46759093D8158db8BB555aC7C6F98070c56169ce',
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
        address: '0x9319710C25cdaDDD1766F0bDE40F1A4034C17c7e',
        history: [],
        constructorArgs: [],
      },
      AccountFactory: {
        name: 'AccountFactory',
        deploy: false,
        address: '0x53958191c3077eDe3Ca90Eb840283df063FC1be3',
        history: [],
        constructorArgs: ['address:AccountGuard'],
      },
      Swap: {
        name: 'Swap',
        address: '',
        deploy: false,
        history: [],
      },
    },
    actions: {
      PositionCreated: {
        name: 'PositionCreated',
        deploy: true,
        address: '',
        serviceRegistryName: 'PositionCreated',
        history: [],
        constructorArgs: [],
      },
      SwapAction: {
        name: 'SwapAction',
        deploy: true,
        address: '',
        serviceRegistryName: 'SwapAction_3',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      TakeFlashloan: {
        name: 'TakeFlashloan',
        deploy: true,
        address: '',
        serviceRegistryName: 'TakeFlashloan_3',
        history: [],
        constructorArgs: ['address:ServiceRegistry', '0x6B175474E89094C44Da98b954EedeAC495271d0F'],
      },
      SetApproval: {
        name: 'SetApproval',
        deploy: true,
        address: '',
        serviceRegistryName: 'SetApproval_3',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      PullToken: {
        name: 'PullToken',
        deploy: true,
        address: '',
        serviceRegistryName: 'PullToken_3',
        history: [],
        constructorArgs: [],
      },
      SendToken: {
        name: 'SendToken',
        deploy: true,
        address: '',
        serviceRegistryName: 'SendToken_4',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      WrapEth: {
        name: 'WrapEth',
        deploy: true,
        address: '',
        serviceRegistryName: 'WrapEth_3',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      UnwrapEth: {
        name: 'UnwrapEth',
        deploy: true,
        address: '',
        serviceRegistryName: 'UnwrapEth_3',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      ReturnFunds: {
        name: 'ReturnFunds',
        deploy: true,
        address: '',
        serviceRegistryName: 'ReturnFunds_3',
        history: [],
        constructorArgs: [],
      },
      AaveBorrow: {
        name: 'AaveBorrow',
        deploy: true,
        address: '',
        serviceRegistryName: 'AaveBorrow_3',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveWithdraw: {
        name: 'AaveWithdraw',
        deploy: true,
        address: '',
        serviceRegistryName: 'AaveWithdraw_3',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveDeposit: {
        name: 'AaveDeposit',
        deploy: true,
        address: '',
        serviceRegistryName: 'AaveDeposit_3',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AavePayback: {
        name: 'AavePayback',
        deploy: true,
        address: '',
        serviceRegistryName: 'AavePayback_3',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Borrow: {
        name: 'AaveV3Borrow',
        deploy: false,
        address: '0x18ca8bE41D32727383bC0F98705f7662ed0B7E28',
        serviceRegistryName: 'AaveV3Borrow',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Withdraw: {
        name: 'AaveV3Withdraw',
        deploy: false,
        address: '',
        serviceRegistryName: 'AaveV3Withdraw',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Deposit: {
        name: 'AaveV3Deposit',
        deploy: false,
        address: '0x852c56859840487DcED2aF501fC06f7462C4f2a8',
        serviceRegistryName: 'AaveV3Deposit',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Payback: {
        name: 'AaveV3Payback',
        deploy: false,
        address: '0xdB736d13CE851Ee81ac2109DF37EBAb8Ce525C42',
        serviceRegistryName: 'AaveV3Payback',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3SetEMode: {
        name: 'AaveV3SetEMode',
        deploy: false,
        address: '0xd4DB3799DEe98Fe752d952Ba6F84Bb99Af829920',
        serviceRegistryName: 'AaveV3SetEMode',
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
      address: '0x41A92d82D70005B55070dB7138b21d7c28F27CC0',
    },
    UniswapRouterV3: {
      name: 'UniswapRouterV3',
      address: '0xe592427a0aece92de3edee1f18e0157c05861564',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.UNISWAP_ROUTER,
    },
    BalancerVault: {
      name: 'BalancerVault',
      address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.BALANCER_VAULT,
    },
    OneInchAggregator: {
      name: 'OneInchAggregator',
      address: '0x1111111254fb6c44bac0bed2854e76f90643097d',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ONE_INCH_AGGREGATOR,
    },
    AuthorizedCaller: {
      name: 'AuthorizedCaller',
      address: '0x85f9b7408afE6CEb5E46223451f5d4b832B522dc',
    },
    FeeRecipient: {
      name: 'FeeRecipient',
      address: '0xC7b548AD9Cf38721810246C079b2d8083aba8909',
    },
    MerkleRedeemer: {
      name: 'MerkleRedeemer',
      address: '0x23440aC6c8a10EA89132da74B705CBc6D99a805b',
    },
    DssCharter: {
      name: 'DssCharter',
      address: '0x7ea0d7ea31C544a472b55D19112e016Ba6708288',
    },
    DssProxyActions: {
      name: 'DssProxyActions',
      address: '0x4023f89983Ece35e227c49806aFc13Bc0248d178',
    },
    DssProxyActionsCharter: {
      name: 'DssProxyActionsCharter',
      address: '0xfFb896D7BEf704DF73abc9A2EBf295CE236c5919',
    },
    DssMultiplyProxyActions: {
      name: 'DssMultiplyProxyActions',
      address: '0xc9628adc0a9f95D1d912C5C19aaBFF85E420a853',
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
      address: '0x15679CdbDb284fe07Eff3809150126697c6e3Dd6',
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
      address: '0x0636E6878703E30aB11Ba13A68C6124d9d252e6B',
    },
    DefaultExchange: {
      name: 'DefaultExchange',
      address: '0x2b0b4c5c58fe3CF8863c4948887099A09b84A69c',
    },
    LowerFeesExchange: {
      name: 'LowerFeesExchange',
      address: '0x2b0b4c5c58fe3CF8863c4948887099A09b84A69c',
    },
    NoFeesExchange: {
      name: 'NoFeesExchange',
      address: '0x2b0b4c5c58fe3CF8863c4948887099A09b84A69c',
    },
    LidoCrvLiquidityFarmingReward: {
      name: 'LidoCrvLiquidityFarmingReward',
      address: ADDRESS_ZERO,
    },
    ChainlinkPriceOracle_USDCUSD: {
      name: 'ChainlinkPriceOracle_USDCUSD',
      address: '0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7',
    },
    ChainlinkPriceOracle_ETHUSD: {
      name: 'ChainlinkPriceOracle_ETHUSD',
      address: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e',
    },
    SdaiOracle: {
      name: 'SdaiOracle',
      address: ADDRESS_ZERO,
    },
    ADAI: { name: 'ADAI', address: ADDRESS_ZERO },
    AAVE: { name: 'AAVE', address: '0x251661BB7C6869165eF35810E5e1D25Ed57be2Fe' },
    BAL: { name: 'BAL', address: '0x8c6e73CA229AB3933426aDb5cc829c1E4928551d' },
    BAT: { name: 'BAT', address: '0x75645f86e90a1169e697707C813419977ea26779' },
    CBETH: { name: 'CBETH', address: ADDRESS_ZERO },
    COMP: { name: 'COMP', address: '0x8032dce0b793C21B8F7B648C01224c3b557271ED' },
    CRVV1ETHSTETH: { name: 'CRVV1ETHSTETH', address: ADDRESS_ZERO },
    DAI: {
      name: 'DAI',
      address: '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844',
      serviceRegistryName: 'DAI',
    },
    ETH: { name: 'ETH', address: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6' },
    FRAX: {
      name: 'FRAX',
      address: ADDRESS_ZERO,
    },
    GHO: { name: 'GHO', address: ADDRESS_ZERO },
    GNO: { name: 'GNO', address: '0x86Bc432064d7F933184909975a384C7E4c9d0977' },
    GUNIV3DAIUSDC1: {
      name: 'GUNIV3DAIUSDC1',
      address: ADDRESS_ZERO,
    },
    GUNIV3DAIUSDC2: {
      name: 'GUNIV3DAIUSDC2',
      address: ADDRESS_ZERO,
    },
    GUSD: { name: 'GUSD', address: '0x67aeF79654D8F6CF44FdC08949c308a4F6b3c45B' },
    KNC: { name: 'KNC', address: '0x9A58801cf901486Df9323bcE83A7684915DBAE54' },
    LDO: { name: 'LDO', address: ADDRESS_ZERO },
    LINK: { name: 'LINK', address: '0x4724A967A4F7E42474Be58AbdF64bF38603422FF' },
    LRC: { name: 'LRC', address: '0xe32aC5b19051728421A8F4A8a5757D0e127a14F6' },
    LUSD: {
      name: 'LUSD',
      address: ADDRESS_ZERO,
    },
    MANA: { name: 'MANA', address: '0x347fceA8b4fD1a46e2c0DB8F79e22d293c2F8513' },
    MATIC: { name: 'MATIC', address: '0x5B3b6CF665Cc7B4552F4347623a2A9E00600CBB5' },
    PAX: { name: 'PAX', address: '0x4547863912Fe2d17D3827704138957a8317E8dCD' },
    PAXUSD: { name: 'PAXUSD', address: '0x4547863912Fe2d17D3827704138957a8317E8dCD' },
    RENBTC: { name: 'RENBTC', address: '0x30d0A215aef6DadA4771a2b30a59B842f969EfD4' },
    RETH: { name: 'RETH', address: '0x62bc478ffc429161115a6e4090f819ce5c50a5d9' },
    RWA001: { name: 'RWA001', address: '0xeb7C7DE82c3b05BD4059f11aE8f43dD7f1595bce' },
    RWA002: { name: 'RWA002', address: '0x09fE0aE289553010D6EcBdFF98cc9C08030dE3b8' },
    RWA003: { name: 'RWA003', address: '0x5cf15Cc2710aFc0EaBBD7e045f84F9556B204331' },
    RWA004: { name: 'RWA004', address: '0xA7fbA77c4d18e12d1F385E2dcFfb377c9dBD91d2' },
    RWA005: { name: 'RWA005', address: '0x650d168fC94B79Bb16898CAae773B0Ce1097Cc3F' },
    RWA006: { name: 'RWA006', address: '0xf754FD6611852eE94AC0614c51B8692cAE9fEe9F' },
    SDAI: { name: 'SDAI', address: '0xd8134205b0328f5676aaefb3b2a0dc15f4029d8c' },
    STETH: { name: 'STETH', address: '0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F' },
    TBTC: { name: 'TBTC', address: '0x679874fbe6d4e7cc54a59e315ff1eb266686a937' },
    TUSD: { name: 'TUSD', address: '0xe0B3D300E2e09c1Fd01252287dDbC70A7730ffB0' },
    UNI: { name: 'UNI', address: '0x82D98aA89E391c6759012df39ccDA0d9d6b24143' },
    UNIV2AAVEETH: { name: 'UNIV2AAVEETH', address: '0xaF2CC6F46d1d0AB30dd45F59B562394c3E21e6f3' },
    UNIV2DAIETH: { name: 'UNIV2DAIETH', address: '0x5dD9dec52a16d4d1Df10a66ac71d4731c9Dad984' },
    UNIV2DAIUSDC: { name: 'UNIV2DAIUSDC', address: '0x260719B2ef507A86116FC24341ff0994F2097D42' },
    UNIV2DAIUSDT: { name: 'UNIV2DAIUSDT', address: '0xBF2C9aBbEC9755A0b6144051E19c6AD4e6fd6D71' },
    UNIV2ETHUSDT: { name: 'UNIV2ETHUSDT', address: '0xfcB32e1C4A4F1C820c9304B5CFfEDfB91aE2321C' },
    UNIV2LINKETH: { name: 'UNIV2LINKETH', address: '0x3361fB8f923D1Aa1A45B2d2eD4B8bdF313a3dA0c' },
    UNIV2UNIETH: { name: 'UNIV2UNIETH', address: '0xB80A38E50B2990Ac83e46Fe16631fFBb94F2780b' },
    UNIV2USDCETH: { name: 'UNIV2USDCETH', address: '0xD90313b3E43D9a922c71d26a0fBCa75A01Bb3Aeb' },
    UNIV2WBTCDAI: { name: 'UNIV2WBTCDAI', address: '0x3f78Bd3980c49611E5FA885f25Ca3a5fCbf0d7A0' },
    UNIV2WBTCETH: { name: 'UNIV2WBTCETH', address: '0x7883a92ac3e914F3400e8AE6a2FF05E6BA4Bd403' },
    USDC: {
      name: 'USDC',
      address: '0x6Fb5ef893d44F4f88026430d82d4ef269543cB23',
      serviceRegistryName: 'USDC',
    },
    USDBC: {
      name: 'USDBC',
      address: '0x0000000000000000000000000000000000000000',
    },
    USDT: { name: 'USDT', address: '0x5858f25cc225525A7494f76d90A6549749b3030B' },
    WBTC: {
      name: 'WBTC',
      address: '0x7ccF0411c7932B99FC3704d68575250F032e3bB7',
      serviceRegistryName: 'WBTC',
    },
    WETH: {
      name: 'WETH',
      address: '0xCCB14936C2E000ED8393A571D15A2672537838Ad',
      serviceRegistryName: 'WETH',
    },
    WLD: { name: 'WLD', address: ADDRESS_ZERO },
    WSTETH: {
      name: 'WSTETH',
      address: '0x6320cD32aA674d2898A68ec82e869385Fc5f7E2f',
      serviceRegistryName: 'WSTETH',
    },
    YIELDBTC: {
      name: 'YIELDBTC',
      address: ADDRESS_ZERO,
    },
    YIELDETH: {
      name: 'YIELDETH',
      address: ADDRESS_ZERO,
    },
    YFI: { name: 'YFI', address: '0xd9510EF268F8273C9b7514F0bfFe18Fe1EFC0d43' },
    ZRX: { name: 'ZRX', address: '0x96E0C18524789ED3e62CD9F56aAEc7cEAC78725a' },
  },
  aave: {
    v2: {
      Oracle: {
        name: 'Oracle',
        address: '0xc1c6f3b788FE7F4bB896a2Fad65F5a8c0Ad509C9',
      },
      LendingPool: {
        name: 'LendingPool',
        address: '0x4bd5643ac6f66a5237E18bfA7d47cF22f1c9F210',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.LENDING_POOL,
      },
      PoolDataProvider: {
        name: 'PoolDataProvider',
        address: '0x927F584d4321C1dCcBf5e2902368124b02419a1E',
      },
      WETHGateway: {
        name: 'WETHGateway',
        address: ADDRESS_ZERO,
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.WETH_GATEWAY,
      },
    },
    v3: {
      Oracle: {
        name: 'Oracle',
        address: '0x9F616c65b5298E24e155E4486e114516BC635b63',
      },
      LendingPool: {
        name: 'LendingPool',
        address: '0x6060Cf73C79098D32c9b936F4B26283427f1BFAd',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.AAVE_POOL,
      },
      PoolDataProvider: {
        name: 'PoolDataProvider',
        address: '0xa41E284482F9923E265832bE59627d91432da76C',
      },
      L2Encoder: {
        name: 'L2Encoder',
        address: ADDRESS_ZERO,
      },
    },
  },
  maker: {
    common: {
      FlashMintModule: {
        name: 'FlashMintModule',
        address: '0x60744434d6339a6B27d73d9Eda62b6F66a0a04FA',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.maker.FLASH_MINT_MODULE,
      },
      Chainlog: {
        name: 'Chainlog',
        address: ADDRESS_ZERO,
      },
      CdpManager: {
        name: 'CdpManager',
        address: '0xdcBf58c9640A7bd0e062f8092d70fb981Bb52032',
      },
      GetCdps: {
        name: 'GetCdps',
        address: '0x7843fd599F5382328DeBB45255deB3E2e0DEC876',
      },
      Jug: {
        name: 'Jug',
        address: '0xC90C99FE9B5d5207A03b9F28A6E8A19C0e558916',
      },
      Pot: {
        name: 'Pot',
        address: '0x50672F0a14B40051B65958818a7AcA3D54Bd81Af',
      },
      End: {
        name: 'End',
        address: '0xDb1d3edb80d3faA1B7257Ab4018A609E327FA50D',
      },
      Spot: {
        name: 'Spot',
        address: '0xACe2A9106ec175bd56ec05C9E38FE1FDa8a1d758',
      },
      Dog: {
        name: 'Dog',
        address: '0x5cf85A37Dbd28A239698B4F9aA9a03D55C04F292',
      },
      Vat: {
        name: 'Vat',
        address: '0xB966002DDAa2Baf48369f5015329750019736031',
      },
      McdGov: {
        name: 'McdGov',
        address: '0xc5E4eaB513A7CD12b2335e8a0D57273e13D499f7',
      },
    },
    joins: {
      MCD_JOIN_DAI: {
        name: 'MCD_JOIN_DAI',
        address: '0x6a60b7070befb2bfc964F646efDF70388320f4E0',
      },
      MCD_JOIN_ETH_A: {
        name: 'MCD_JOIN_ETH_A',
        address: '0x2372031bB0fC735722AA4009AeBf66E8BEAF4BA1',
      },
      MCD_JOIN_ETH_B: {
        name: 'MCD_JOIN_ETH_B',
        address: '0x1710BB6dF1967679bb1f247135794692F7963B46',
      },
      MCD_JOIN_ETH_C: {
        name: 'MCD_JOIN_ETH_C',
        address: '0x16e6490744d4B3728966f8e72416c005EB3dEa79',
      },
      MCD_JOIN_BAT_A: {
        name: 'MCD_JOIN_BAT_A',
        address: '0xfea8C23D32e4bA46d90AeD2445fBD099010eAdF5',
      },
      MCD_JOIN_USDC_A: {
        name: 'MCD_JOIN_USDC_A',
        address: '0x33E88C8b3530e2f19050b24f44AcB78C7114AF46',
      },
      MCD_JOIN_USDC_B: {
        name: 'MCD_JOIN_USDC_B',
        address: '0x0Dc70CC4505c1952e719C9C740608A75Ca9e299e',
      },
      MCD_JOIN_PSM_USDC_A: {
        name: 'MCD_JOIN_PSM_USDC_A',
        address: '0xF2f86B76d1027f3777c522406faD710419C80bbB',
      },
      MCD_JOIN_TUSD_A: {
        name: 'MCD_JOIN_TUSD_A',
        address: '0x5BC597f00d74fAcEE53Be784f0B7Ace63b4e2EBe',
      },
      MCD_JOIN_WBTC_A: {
        name: 'MCD_JOIN_WBTC_A',
        address: '0x3cbE712a12e651eEAF430472c0C1BF1a2a18939D',
      },
      MCD_JOIN_WBTC_B: {
        name: 'MCD_JOIN_WBTC_B',
        address: '0x13B8EB3d2d40A00d65fD30abF247eb470dDF6C25',
      },
      MCD_JOIN_WBTC_C: {
        name: 'MCD_JOIN_WBTC_C',
        address: '0xe15E69F10E1A362F69d9672BFeA20B75CFf8574A',
      },
      MCD_JOIN_ZRX_A: {
        name: 'MCD_JOIN_ZRX_A',
        address: '0xC279765B3f930742167dB91271f13353336B6C72',
      },
      MCD_JOIN_KNC_A: {
        name: 'MCD_JOIN_KNC_A',
        address: '0xA48f0d5DA642928BC1F5dB9De5F5d3D466500075',
      },
      MCD_JOIN_MANA_A: {
        name: 'MCD_JOIN_MANA_A',
        address: '0xF4a1E7Dd685b4EaFBE5d0E70e20c153dee2E290b',
      },
      MCD_JOIN_USDT_A: {
        name: 'MCD_JOIN_USDT_A',
        address: '0xa8C62cC41AbF8A199FB484Ea363b90C3e9E01d86',
      },
      MCD_JOIN_PAXUSD_A: {
        name: 'MCD_JOIN_PAXUSD_A',
        address: '0x8Ef390647A74150a79EC73FE120EaaF8bE9eEdf0',
      },
      MCD_JOIN_PSM_PAX_A: {
        name: 'MCD_JOIN_PSM_PAX_A',
        address: '0xF27E1F580D5e82510b47C7B2A588A8A533787d38',
      },
      MCD_JOIN_COMP_A: {
        name: 'MCD_JOIN_COMP_A',
        address: '0x544EFa934f26cd6FdFD86883408538150Bdd6725',
      },
      MCD_JOIN_LRC_A: {
        name: 'MCD_JOIN_LRC_A',
        address: '0x12af538aCf746c0BBe076E5eBAE678e022E1F5f6',
      },
      MCD_JOIN_LINK_A: {
        name: 'MCD_JOIN_LINK_A',
        address: '0x4420FD4E5C414189708376F3fBAA4dCA6277369a',
      },
      MCD_JOIN_BAL_A: {
        name: 'MCD_JOIN_BAL_A',
        address: '0xb31cE33511c2CCEfBc1713A783042eE670Cf5930',
      },
      MCD_JOIN_YFI_A: {
        name: 'MCD_JOIN_YFI_A',
        address: '0xa318E65982E80F54486f71965A0C320858759299',
      },
      MCD_JOIN_GUSD_A: {
        name: 'MCD_JOIN_GUSD_A',
        address: '0x455451293100C5c5355db10512DEE81F75E45Edf',
      },
      MCD_JOIN_PSM_GUSD_A: {
        name: 'MCD_JOIN_PSM_GUSD_A',
        address: '0x4115fDa246e2583b91aD602213f2ac4fC6E437Ca',
      },
      MCD_JOIN_UNI_A: {
        name: 'MCD_JOIN_UNI_A',
        address: '0x31aE6e37964f26f4112A8Fc70e0B680F18e4DC6A',
      },
      MCD_JOIN_RENBTC_A: {
        name: 'MCD_JOIN_RENBTC_A',
        address: '0xb4576162aC5d1bC7C69bA85F39e8f694d44d09D0',
      },
      MCD_JOIN_AAVE_A: {
        name: 'MCD_JOIN_AAVE_A',
        address: '0x71Ae3e3ac4412865A4E556230b92aB58d895b497',
      },
      MCD_JOIN_MATIC_A: {
        name: 'MCD_JOIN_MATIC_A',
        address: '0xeb680839564F0F9bFB96fE2dF47a31cE31689e63',
      },
      MCD_JOIN_WSTETH_A: {
        name: 'MCD_JOIN_WSTETH_A',
        address: '0xF99834937715255079849BE25ba31BF8b5D5B45D',
      },
      MCD_JOIN_WSTETH_B: {
        name: 'MCD_JOIN_WSTETH_B',
        address: '0x4a2dfbdfb0ea68823265fab4de55e22f751ed12c',
      },
      MCD_JOIN_UNIV2DAIETH_A: {
        name: 'MCD_JOIN_UNIV2DAIETH_A',
        address: '0x66931685b532CB4F31abfe804d2408dD34Cd419D',
      },
      MCD_JOIN_UNIV2WBTCETH_A: {
        name: 'MCD_JOIN_UNIV2WBTCETH_A',
        address: '0x345a29Db10Aa5CF068D61Bb20F74771eC7DF66FE',
      },
      MCD_JOIN_UNIV2USDCETH_A: {
        name: 'MCD_JOIN_UNIV2USDCETH_A',
        address: '0x46267d84dA4D6e7b2F5A999518Cf5DAF91E204E3',
      },
      MCD_JOIN_UNIV2DAIUSDC_A: {
        name: 'MCD_JOIN_UNIV2DAIUSDC_A',
        address: '0x4CEEf4EB4988cb374B0b288D685AeBE4c6d4C41E',
      },
      MCD_JOIN_UNIV2ETHUSDT_A: {
        name: 'MCD_JOIN_UNIV2ETHUSDT_A',
        address: '0x46A8f8e2C0B62f5D7E4c95297bB26a457F358C82',
      },
      MCD_JOIN_UNIV2LINKETH_A: {
        name: 'MCD_JOIN_UNIV2LINKETH_A',
        address: '0x98B7023Aced6D8B889Ad7D340243C3F9c81E8c5F',
      },
      MCD_JOIN_UNIV2UNIETH_A: {
        name: 'MCD_JOIN_UNIV2UNIETH_A',
        address: '0x52c31E3592352Cd0CBa20Fa73Da42584EC693283',
      },
      MCD_JOIN_UNIV2WBTCDAI_A: {
        name: 'MCD_JOIN_UNIV2WBTCDAI_A',
        address: '0x04d23e99504d61050CAF46B4ce2dcb9D4135a7fD',
      },
      MCD_JOIN_UNIV2AAVEETH_A: {
        name: 'MCD_JOIN_UNIV2AAVEETH_A',
        address: '0x73C4E5430768e24Fd704291699823f35953bbbA2',
      },
      MCD_JOIN_UNIV2DAIUSDT_A: {
        name: 'MCD_JOIN_UNIV2DAIUSDT_A',
        address: '0xBF70Ca17ce5032CCa7cD55a946e96f0E72f79452',
      },
      MCD_JOIN_RWA001_A: {
        name: 'MCD_JOIN_RWA001_A',
        address: '0x088D6b3f68Bc4F93F90006A1356A21145EDD96E2',
      },
      MCD_JOIN_RWA002_A: {
        name: 'MCD_JOIN_RWA002_A',
        address: '0xc0aeE42b5E77e931BAfd98EAdd321e704fD7CA1f',
      },
      MCD_JOIN_RWA003_A: {
        name: 'MCD_JOIN_RWA003_A',
        address: '0x83fA1F7c423112aBC6B340e32564460eDcf6AD74',
      },
      MCD_JOIN_RWA004_A: {
        name: 'MCD_JOIN_RWA004_A',
        address: '0xA74036937413B799b2f620a3b6Ea61ad08F1D354',
      },
      MCD_JOIN_RWA005_A: {
        name: 'MCD_JOIN_RWA005_A',
        address: '0xc5052A70e00983ffa6894679f1d9c0cDAFe28416',
      },
      MCD_JOIN_RWA006_A: {
        name: 'MCD_JOIN_RWA006_A',
        address: '0x5b4B7797FC41123578718AD4E3F04d1Bde9685DC',
      },
      MCD_JOIN_RETH_A: {
        name: 'MCD_JOIN_RETH_A',
        address: '0xdef7d394a4ed62273265ce983107b3748f775265',
      },
      MCD_JOIN_GNO_A: {
        name: 'MCD_JOIN_GNO_A',
        address: '0x05a3b9D5F8098e558aF33c6b83557484f840055e',
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
        address: '0x94588e35fF4d2E99ffb8D5095F35d1E37d6dDf12',
      },
      PIP_BAT: {
        name: 'PIP_BAT',
        address: '0x2BA78cb27044edCb715b03685D4bf74261170a70',
      },
      PIP_USDC: {
        name: 'PIP_USDC',
        address: '0x838212865E2c2f4F7226fCc0A3EFc3EB139eC661',
      },
      PIP_TUSD: {
        name: 'PIP_TUSD',
        address: '0x0ce19eA2C568890e63083652f205554C927a0caa',
      },
      PIP_WBTC: {
        name: 'PIP_WBTC',
        address: '0xE7de200a3a29E9049E378b52BD36701A0Ce68C3b',
      },
      PIP_ZRX: {
        name: 'PIP_ZRX',
        address: '0xe9245D25F3265E9A36DcCDC72B0B5dE1eeACD4cD',
      },
      PIP_KNC: {
        name: 'PIP_KNC',
        address: '0xCB772363E2DEc06942edbc5E697F4A9114B5989c',
      },
      PIP_MANA: {
        name: 'PIP_MANA',
        address: '0x001eDD66a5Cc9268159Cf24F3dC0AdcE456AAAAb',
      },
      PIP_USDT: {
        name: 'PIP_USDT',
        address: '0x1fA3B8DAeE1BCEe33990f66F1a99993daD14D855',
      },
      PIP_PAXUSD: {
        name: 'PIP_PAXUSD',
        address: '0xdF8474337c9D3f66C0b71d31C7D3596E4F517457',
      },
      PIP_PAX: {
        name: 'PIP_PAX',
        address: '0xdF8474337c9D3f66C0b71d31C7D3596E4F517457',
      },
      PIP_COMP: {
        name: 'PIP_COMP',
        address: '0xc3d677a5451cAFED13f748d822418098593D3599',
      },
      PIP_LRC: {
        name: 'PIP_LRC',
        address: '0x5AD3A560BB125d00db8E94915232BA8f6166967C',
      },
      PIP_LINK: {
        name: 'PIP_LINK',
        address: '0x75B4e743772D25a7998F4230cb016ddCF2c52629',
      },
      PIP_BAL: {
        name: 'PIP_BAL',
        address: '0xF15993A5C5BE496b8e1c9657Fd2233b579Cd3Bc6',
      },
      PIP_YFI: {
        name: 'PIP_YFI',
        address: '0xAafF0066D05cEe0D6a38b4dac77e73d9E0a5Cf46',
      },
      PIP_GUSD: {
        name: 'PIP_GUSD',
        address: '0x57A00620Ba1f5f81F20565ce72df4Ad695B389d7',
      },
      PIP_UNI: {
        name: 'PIP_UNI',
        address: '0xf1a5b808fbA8fF80982dACe88020d4a80c91aFe6',
      },
      PIP_RENBTC: {
        name: 'PIP_RENBTC',
        address: '0xE7de200a3a29E9049E378b52BD36701A0Ce68C3b',
      },
      PIP_AAVE: {
        name: 'PIP_AAVE',
        address: '0xC26E53eF1F71481DE53bfb77875Ffb3aCf4d91f0',
      },
      PIP_MATIC: {
        name: 'PIP_MATIC',
        address: '0xDe112F61b823e776B3439f2F39AfF41f57993045',
      },
      PIP_WSTETH: {
        name: 'PIP_WSTETH',
        address: '0x323eac5246d5BcB33d66e260E882fC9bF4B6bf41',
      },
      PIP_UNIV2DAIETH: {
        name: 'PIP_UNIV2DAIETH',
        address: '0x044c9aeD56369aA3f696c898AEd0C38dC53c6C3D',
      },
      PIP_UNIV2WBTCETH: {
        name: 'PIP_UNIV2WBTCETH',
        address: '0xD375daC26f7eF991878136b387ca959b9ac1DDaF',
      },
      PIP_UNIV2USDCETH: {
        name: 'PIP_UNIV2USDCETH',
        address: '0x54ADcaB9B99b1B548764dAB637db751eC66835F0',
      },
      PIP_UNIV2DAIUSDC: {
        name: 'PIP_UNIV2DAIUSDC',
        address: '0xEf22289E240cFcCCdCD2B98fdefF167da10f452d',
      },
      PIP_UNIV2ETHUSDT: {
        name: 'PIP_UNIV2ETHUSDT',
        address: '0x974f7f4dC6D91f144c87cc03749c98f85F997bc7',
      },
      PIP_UNIV2LINKETH: {
        name: 'PIP_UNIV2LINKETH',
        address: '0x11C884B3FEE1494A666Bb20b6F6144387beAf4A6',
      },
      PIP_UNIV2UNIETH: {
        name: 'PIP_UNIV2UNIETH',
        address: '0xB18BC24e52C23A77225E7cf088756581EE257Ad8',
      },
      PIP_UNIV2WBTCDAI: {
        name: 'PIP_UNIV2WBTCDAI',
        address: '0x916fc346910fd25867c81874f7F982a1FB69aac7',
      },
      PIP_UNIV2AAVEETH: {
        name: 'PIP_UNIV2AAVEETH',
        address: '0xFADF05B56E4b211877248cF11C0847e7F8924e10',
      },
      PIP_UNIV2DAIUSDT: {
        name: 'PIP_UNIV2DAIUSDT',
        address: '0x2fc2706C61Fba5b941381e8838bC646908845db6',
      },
      PIP_RWA001: {
        name: 'PIP_RWA001',
        address: '0x95282c2cDE88b93F784E2485f885580275551387',
      },
      PIP_RWA002: {
        name: 'PIP_RWA002',
        address: '0xF1E8E72AE116193A9fA551beC1cda965147b31DA',
      },
      PIP_RWA003: {
        name: 'PIP_RWA003',
        address: '0x27E599C9D69e02477f5ffF4c8E4E42B97777eE52',
      },
      PIP_RWA004: {
        name: 'PIP_RWA004',
        address: '0x3C191d5a74800A99D8747fdffAea42F60f7d3Bff',
      },
      PIP_RWA005: {
        name: 'PIP_RWA005',
        address: '0xa6A7f2408949cAbD13f254F8e77ad5C9896725aB',
      },
      PIP_RWA006: {
        name: 'PIP_RWA006',
        address: '0xA410A66313F943d022b79f2943C9A37CefdE2371',
      },
      PIP_RETH: {
        name: 'PIP_RETH',
        address: '0x27a25935d8b0006a97e11caddc2b3bf3a6721c13',
      },
      PIP_GNO: {
        name: 'PIP_GNO',
        address: '0xf15221A159A4e7ba01E0d6e72111F0Ddff8Fa8Da',
      },
      PIP_WETH: {
        name: 'PIP_WETH',
        address: ADDRESS_ZERO,
      },
      PIP_ADAI: {
        name: 'PIP_ADAI',
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
    },
  },
  spark: {},
  automation: {
    AutomationBot: {
      name: 'AutomationBot',
      address: '0xabDB63B4b3BA9f960CF942800a6982F88e9b1A6b',
    },
    AutomationBotV2: {
      name: 'AutomationBotV2',
      address: '0x0',
    },
    AutomationBotAggregator: {
      name: 'AutomationBotAggregator',
      address: '0xeb3c922A805FAEEac8f311E1AdF34fBC518099ab',
    },
  },
  ajna: {
    AjnaPoolInfo: {
      name: 'AjnaPoolInfo',
      address: '0x28ef92e694d1044917981837b21e5eA994931c71',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.AJNA_POOL_UTILS_INFO,
    },
    AjnaProxyActions: {
      name: 'AjnaProxyActions',
      address: '0x1F15c0832bF01094C077A780ea85dC7Cfe6C209C',
    },
    AjnaPoolPairs_ETHDAI: {
      name: 'AjnaPoolPairs_ETHDAI',
      address: '0x03743F1315604e8374f0BD317F60324747692717',
    },
    AjnaPoolPairs_ETHUSDC: {
      name: 'AjnaPoolPairs_ETHUSDC',
      address: '0xcDF3047503923b1E1fDF2190aaFe3254A7F1A632',
    },
    AjnaPoolPairs_RETHDAI: {
      name: 'AjnaPoolPairs_RETHDAI',
      address: '0x578479315F307A076e1048b382fa8F92D22364eD',
    },
    AjnaPoolPairs_RETHETH: {
      name: 'AjnaPoolPairs_RETHETH',
      address: '0x85e59a43555eA87cA87AcB4941343088F76D8f9C',
    },
    AjnaPoolPairs_RETHUSDC: {
      name: 'AjnaPoolPairs_RETHUSDC',
      address: '0xd2dea6510EE3c4FcEAD3605EF33DB3ab2439c15d',
    },
    AjnaPoolPairs_USDCETH: {
      name: 'AjnaPoolPairs_USDCETH',
      address: '0xb93628E0f66a6b65a2A7b24dADCeA17fC423D914',
    },
    AjnaPoolPairs_USDCDAI: { name: 'AjnaPoolPairs_USDCDAI', address: '' },
    AjnaPoolPairs_USDCWBTC: {
      name: 'AjnaPoolPairs_USDCWBTC',
      address: '0xaEbb326B1a7Beb2Bd7d9B23473CF7b11E45e0802',
    },
    AjnaPoolPairs_WBTCDAI: {
      name: 'AjnaPoolPairs_WBTCDAI',
      address: '0x53CA820E35855A0Ac63788Dd852d0283195C65A0',
    },
    AjnaPoolPairs_WBTCUSDC: {
      name: 'AjnaPoolPairs_WBTCUSDC',
      address: '0xE938A854f843E143936A7c4d2c43Cb5c15c65a48',
    },
    AjnaPoolPairs_WSTETHDAI: {
      name: 'AjnaPoolPairs_WSTETHDAI',
      address: '0x78b4102D793bdb0e9fc6B80B852036c9045A5d6C',
    },
    AjnaPoolPairs_WSTETHETH: {
      name: 'AjnaPoolPairs_WSTETHETH',
      address: '0x2ae4C56d48f5Bbda17E8e7E2D8199dD510e337aC',
    },
    AjnaPoolPairs_WSTETHUSDC: {
      name: 'AjnaPoolPairs_WSTETHUSDC',
      address: '0x29eD1a103c9F59ed58bA96c1867DF3Ca9C7946D1',
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
      address: '0x994dE190dd763Af3126FcC8EdC139275937d800b',
    },
    AjnaRewardsClaimer: {
      name: 'AjnaRewardsClaimer',
      address: '0xFb6EdFC7ADc67645423c233332efD6E6804e72F5',
    },
    ERC20PoolFactory: {
      name: 'ERC20PoolFactory',
      address: '0x01Da8a85A5B525D476cA2b51e44fe7087fFafaFF',
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
