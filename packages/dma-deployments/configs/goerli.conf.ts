import { CONTRACT_NAMES } from '@dma-deployments/constants'
import { SystemConfig } from '@dma-deployments/types/deployment-config'
import { constants } from 'ethers'

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
        serviceRegistryName: CONTRACT_NAMES.common.DS_PROXY_FACTORY,
        history: [],
        constructorArgs: [],
      },
      DSProxyRegistry: {
        name: 'DSProxyRegistry',
        deploy: false,
        address: '0x46759093D8158db8BB555aC7C6F98070c56169ce',
        serviceRegistryName: CONTRACT_NAMES.common.DS_PROXY_REGISTRY,
        history: [],
        constructorArgs: ['address:DSProxyFactory'],
      },
      DSGuardFactory: {
        name: 'DSGuardFactory',
        deploy: false,
        address: constants.AddressZero,
        serviceRegistryName: CONTRACT_NAMES.common.DS_GUARD_FACTORY,
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
      serviceRegistryName: CONTRACT_NAMES.common.UNISWAP_ROUTER,
    },
    BalancerVault: {
      name: 'BalancerVault',
      address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      serviceRegistryName: CONTRACT_NAMES.common.BALANCER_VAULT,
    },
    OneInchAggregator: {
      name: 'OneInchAggregator',
      address: '0x1111111254fb6c44bac0bed2854e76f90643097d',
      serviceRegistryName: CONTRACT_NAMES.common.ONE_INCH_AGGREGATOR,
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
      address: constants.AddressZero,
    },
    DssProxyActionsCropjoin: {
      name: 'DssProxyActionsCropjoin',
      address: constants.AddressZero,
    },
    DssProxyActionsDsr: {
      name: 'DssProxyActionsDsr',
      address: '0x15679CdbDb284fe07Eff3809150126697c6e3Dd6',
    },
    Otc: {
      name: 'Otc',
      address: constants.AddressZero,
    },
    OtcSupportMethods: {
      name: 'OtcSupportMethods',
      address: constants.AddressZero,
    },
    ServiceRegistry: {
      name: 'ServiceRegistry',
      address: constants.AddressZero,
    },
    GuniProxyActions: {
      name: 'GuniProxyActions',
      address: constants.AddressZero,
    },
    GuniResolver: {
      name: 'GuniResolver',
      address: constants.AddressZero,
    },
    GuniRouter: {
      name: 'GuniRouter',
      address: constants.AddressZero,
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
      address: constants.AddressZero,
    },
    ChainlinkPriceOracle_USDCUSD: {
      name: 'ChainlinkPriceOracle_USDCUSD',
      address: '0xAb5c49580294Aff77670F839ea425f5b78ab3Ae7',
    },
    ChainlinkPriceOracle_ETHUSD: {
      name: 'ChainlinkPriceOracle_ETHUSD',
      address: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e',
    },
    ADAI: { name: 'ADAI', address: constants.AddressZero },
    AAVE: { name: 'AAVE', address: '0x251661BB7C6869165eF35810E5e1D25Ed57be2Fe' },
    BAL: { name: 'BAL', address: '0x8c6e73CA229AB3933426aDb5cc829c1E4928551d' },
    BAT: { name: 'BAT', address: '0x75645f86e90a1169e697707C813419977ea26779' },
    COMP: { name: 'COMP', address: '0x8032dce0b793C21B8F7B648C01224c3b557271ED' },
    CRVV1ETHSTETH: { name: 'CRVV1ETHSTETH', address: constants.AddressZero },
    DAI: {
      name: 'DAI',
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      serviceRegistryName: 'DAI',
    },
    ETH: { name: 'ETH', address: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6' },
    GNO: { name: 'GNO', address: '0x86Bc432064d7F933184909975a384C7E4c9d0977' },
    GUNIV3DAIUSDC1: {
      name: 'GUNIV3DAIUSDC1',
      address: constants.AddressZero,
    },
    GUNIV3DAIUSDC2: {
      name: 'GUNIV3DAIUSDC2',
      address: constants.AddressZero,
    },
    GUSD: { name: 'GUSD', address: '0x67aeF79654D8F6CF44FdC08949c308a4F6b3c45B' },
    KNC: { name: 'KNC', address: '0x9A58801cf901486Df9323bcE83A7684915DBAE54' },
    LDO: { name: 'LDO', address: constants.AddressZero },
    LINK: { name: 'LINK', address: '0x4724A967A4F7E42474Be58AbdF64bF38603422FF' },
    LRC: { name: 'LRC', address: '0xe32aC5b19051728421A8F4A8a5757D0e127a14F6' },
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
    STETH: { name: 'STETH', address: '0x1643E812aE58766192Cf7D2Cf9567dF2C37e9B7F' },
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
      address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
      serviceRegistryName: 'USDC',
    },
    USDT: { name: 'USDT', address: '0x5858f25cc225525A7494f76d90A6549749b3030B' },
    WBTC: {
      name: 'WBTC',
      address: '0x7ccF0411c7932B99FC3704d68575250F032e3bB7',
      serviceRegistryName: 'WBTC',
    },
    WETH: {
      name: 'WETH',
      address: '0x4200000000000000000000000000000000000006',
      serviceRegistryName: 'WETH',
    },
    WSTETH: {
      name: 'WSTETH',
      address: '0x6320cD32aA674d2898A68ec82e869385Fc5f7E2f',
      serviceRegistryName: 'WSTETH',
    },
    YFI: { name: 'YFI', address: '0xd9510EF268F8273C9b7514F0bfFe18Fe1EFC0d43' },
    ZRX: { name: 'ZRX', address: '0x96E0C18524789ED3e62CD9F56aAEc7cEAC78725a' },
  },
  aave: {
    v2: {
      PriceOracle: {
        name: 'PriceOracle',
        address: '0xc1c6f3b788FE7F4bB896a2Fad65F5a8c0Ad509C9',
      },
      LendingPool: {
        name: 'LendingPool',
        address: '0x4bd5643ac6f66a5237E18bfA7d47cF22f1c9F210',
        serviceRegistryName: CONTRACT_NAMES.aave.v2.LENDING_POOL,
      },
      ProtocolDataProvider: {
        name: 'ProtocolDataProvider',
        address: '0x927F584d4321C1dCcBf5e2902368124b02419a1E',
      },
      WETHGateway: {
        name: 'WETHGateway',
        address: constants.AddressZero,
        serviceRegistryName: CONTRACT_NAMES.aave.v2.WETH_GATEWAY,
      },
    },
    v3: {
      AaveOracle: {
        name: 'AaveOracle',
        address: '0x9F616c65b5298E24e155E4486e114516BC635b63',
      },
      Pool: {
        name: 'Pool',
        address: '0x6060Cf73C79098D32c9b936F4B26283427f1BFAd',
        serviceRegistryName: CONTRACT_NAMES.aave.v3.AAVE_POOL,
      },
      AaveProtocolDataProvider: {
        name: 'AaveProtocolDataProvider',
        address: '0xa41E284482F9923E265832bE59627d91432da76C',
      },
    },
  },
  maker: {
    common: {
      FlashMintModule: {
        name: 'FlashMintModule',
        address: '0x60744434d6339a6B27d73d9Eda62b6F66a0a04FA',
        serviceRegistryName: CONTRACT_NAMES.maker.FLASH_MINT_MODULE,
      },
      Chainlog: {
        name: 'Chainlog',
        address: constants.AddressZero,
      },
      CdpManager: {
        name: 'CdpManager',
        address: '0xdcBf58c9640A7bd0e062f8092d70fb981Bb52032',
      },
      GetCdps: {
        name: 'GetCdps',
        address: constants.AddressZero,
      },
      Jug: {
        name: 'Jug',
        address: constants.AddressZero,
      },
      Pot: {
        name: 'Pot',
        address: constants.AddressZero,
      },
      End: {
        name: 'End',
        address: constants.AddressZero,
      },
      Spot: {
        name: 'Spot',
        address: constants.AddressZero,
      },
      Dog: {
        name: 'Dog',
        address: constants.AddressZero,
      },
      Vat: {
        name: 'Vat',
        address: '0xB966002DDAa2Baf48369f5015329750019736031',
      },
      McdGov: {
        name: 'McdGov',
        address: constants.AddressZero,
      },
      JoinDAI: {
        name: 'JoinDAI',
        address: constants.AddressZero,
      },
      JoinETH_A: {
        name: 'JoinETH_A',
        address: constants.AddressZero,
      },
      PipWETH: {
        name: 'PipWETH',
        address: constants.AddressZero,
      },
      PipLINK: {
        name: 'PipLINK',
        address: constants.AddressZero,
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
        address: constants.AddressZero,
      },
      MCD_JOIN_GUNIV3DAIUSDC1_A: {
        name: 'MCD_JOIN_GUNIV3DAIUSDC1_A',
        address: constants.AddressZero,
      },
      MCD_JOIN_GUNIV3DAIUSDC2_A: {
        name: 'MCD_JOIN_GUNIV3DAIUSDC2_A',
        address: constants.AddressZero,
      },
      MCD_JOIN_CRVV1ETHSTETH_A: {
        name: 'MCD_JOIN_CRVV1ETHSTETH_A',
        address: constants.AddressZero,
      },
    },
  },
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
      address: '0xEa36b2a4703182d07df9DdEe46BF97f9979F0cCf',
    },
    AjnaProxyActions: {
      name: 'AjnaProxyActions',
      address: '0xE27E4fAdE5d3A2Bf6D76D0a20d437314d9da6139',
    },
    AjnaPoolPairs_WBTCUSDC: {
      name: 'AjnaPoolPairs_WBTCUSDC',
      address: '0x17e5a1A6450d4fB32fFFc329ca92db55293db10e',
    },
    AjnaPoolPairs_ETHUSDC: {
      name: 'AjnaPoolPairs_ETHUSDC',
      address: '0xe1200AEfd60559D494d4419E17419571eF8fC1Eb',
    },
    AjnaRewardsManager: {
      name: 'AjnaRewardsManager',
      address: '0xEd6890d748e62ddbb3f80e7256Deeb2fBb853476',
    },
    AjnaRewardsClaimer: {
      name: 'AjnaRewardsClaimer',
      address: '0xEd6890d748e62ddbb3f80e7256Deeb2fBb853476',
    },
  },
}
