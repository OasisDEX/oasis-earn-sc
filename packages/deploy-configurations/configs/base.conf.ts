import { ADDRESS_ZERO, loadContractNames } from '@deploy-configurations/constants'
import { SystemConfig } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'

import { commonDefaults } from './shared/common-defaults'
import { emptyAjnaPools } from './shared/empty-ajna-pools'

const SERVICE_REGISTRY_NAMES = loadContractNames(Network.BASE)

export const config: SystemConfig = {
  mpa: {
    core: {
      ServiceRegistry: {
        name: 'ServiceRegistry',
        deploy: false,
        address: '0x0c1EDa5544EA63cf3d365912343161913a8f19Eb',
        history: [],
        constructorArgs: [0],
      },
      OperationExecutor: {
        name: 'OperationExecutor',
        deploy: false,
        address: '0xb65Cbf9689979e1749B38Ba5D5155c70500292D8',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATION_EXECUTOR,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      OperationStorage: {
        name: 'OperationStorage',
        deploy: false,
        address: '0x2Cb950c62Bc2e76DAEb86223E5F5D46EE9048EA4',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATION_STORAGE,
        history: [],
        constructorArgs: ['address:ServiceRegistry', 'address:OperationExecutor'],
      },
      OperationsRegistry: {
        name: 'OperationsRegistry',
        deploy: false,
        address: '0x1F15c0832bF01094C077A780ea85dC7Cfe6C209C',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATIONS_REGISTRY,
        history: [],
        constructorArgs: [],
      },
      DSProxyFactory: {
        name: 'DSProxyFactory',
        deploy: false,
        address: '0x6eB5e634773E271F7FA7222e4244438Ea74674F1',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_PROXY_FACTORY,
        history: [],
        constructorArgs: [],
      },
      DSProxyRegistry: {
        name: 'DSProxyRegistry',
        deploy: false,
        address: '0x425fA97285965E01Cc5F951B62A51F6CDEA5cc0d',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_PROXY_REGISTRY,
        history: [],
        constructorArgs: ['address:DSProxyFactory'],
      },
      DSGuardFactory: {
        name: 'DSGuardFactory',
        deploy: false,
        address: '0x89010CBE61Ba3A800aFDc20D22E8163c6256E5Ef',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_GUARD_FACTORY,
        history: [],
        constructorArgs: [],
      },
      AccountGuard: {
        name: 'AccountGuard',
        deploy: false,
        address: '0x83c8BFfD11913f0e94C1C0B615fC2Fdb1B17A27e',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ACCOUNT_GUARD,
        history: [],
        constructorArgs: [],
      },
      AccountFactory: {
        name: 'AccountFactory',
        deploy: false,
        address: '0x881CD31218f45a75F8ad543A3e1Af087f3986Ae0',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ACCOUNT_FACTORY,
        history: [],
        constructorArgs: ['address:AccountGuard'],
      },
      Swap: {
        name: 'Swap',
        deploy: false,
        address: '0x892a23d33537d315E289e86D97291a49F487C624',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SWAP,
        history: [],
        constructorArgs: [
          '0x8E78CC7089509B568a401f593F64B3074693d25E',
          '0x49ab24Da055B8550fF88456E701e4FAB72D6987B',
          20,
          'address:ServiceRegistry',
        ],
      },
      ERC20ProxyActions: {
        name: 'ERC20ProxyActions',
        deploy: false,
        address: '0xfcf904440a91905DcEFa9C89d044A83608D2472E',
        history: [],
        constructorArgs: [],
      },
    },
    actions: {
      ERC4626Deposit: {
        name: 'ERC4626Deposit',
        deploy: false,
        address: '0x90Ddf2551b02E4003a831E48cc8bA94d54Cef898',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ERC4626_DEPOSIT,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      ERC4626Withdraw: {
        name: 'ERC4626Withdraw',
        deploy: false,
        address: '0x9134205b3E39E4DCaA7e33b21ACC36a798061d07',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ERC4626_WITHDRAW,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      TokenBalance: {
        name: 'TokenBalance',
        deploy: false,
        address: '0xDB99087a8e1B5Db99c0221C72F066e64C0b4d75E',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.TOKEN_BALANCE,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      PositionCreated: {
        name: 'PositionCreated',
        deploy: false,
        address: '0x8A20e6152B8918BC65a6F8E34B1D6adb4CbeF19F',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.POSITION_CREATED,
        history: [],
        constructorArgs: [],
      },
      SwapAction: {
        name: 'SwapAction',
        deploy: false,
        address: '0x663A9525ffE09b736eb153092c90aaB144eDBa03',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SWAP_ACTION,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      TakeFlashloan: {
        name: 'TakeFlashloan',
        deploy: false,
        address: '0x0d8e5D7A5B45Ce86a75489C7166dF69C9f453D0A',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.TAKE_A_FLASHLOAN,
        history: [],
        constructorArgs: [
          'address:ServiceRegistry',
          '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
          'address:DSGuardFactory',
        ],
      },
      SetApproval: {
        name: 'SetApproval',
        deploy: false,
        address: '0x35e847e3dAD2847C9E39196FCbF1c057b32c6469',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SET_APPROVAL,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      PullToken: {
        name: 'PullToken',
        deploy: false,
        address: '0x52a9bC9a904B9eE6A4714eF883cCf14cb7283B0F',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.PULL_TOKEN,
        history: [],
        constructorArgs: [],
      },
      PullTokenMaxAmount: {
        name: 'PullTokenMaxAmount',
        deploy: false,
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.PULL_TOKEN_MAX_AMOUNT,
        address: '0xfAc966cc77Ec5A69d1fD8018992C1e7e3a8b3a21',
        history: [],
        constructorArgs: [],
      },
      SendToken: {
        name: 'SendToken',
        deploy: false,
        address: '0x98191F148AC0A1EaB75315989b357D83d728Fc43',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SEND_TOKEN,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      WrapEth: {
        name: 'WrapEth',
        deploy: false,
        address: '0x499afBC7aE808e51e48A29FD30e80DfC5B1F2e56',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WRAP_ETH,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      UnwrapEth: {
        name: 'UnwrapEth',
        deploy: false,
        address: '0xc69156420307048c9BAAe8191f9012391521a88d',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.UNWRAP_ETH,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      ReturnFunds: {
        name: 'ReturnFunds',
        deploy: false,
        address: '0xC58F2Ee4Ef92F2bE314743442496D6Fad0339d56',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.RETURN_FUNDS,
        history: [],
        constructorArgs: [],
      },
      ReturnMultipleTokens: {
        name: 'ReturnMultipleTokens',
        deploy: false,
        address: '0x06E3BE1fFf0250ECb867d6F3f0AA18Bd6fE55Bea',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.RETURN_MULTIPLE_TOKENS,
        history: [],
        constructorArgs: [],
      },
      AaveV3Borrow: {
        name: 'AaveV3Borrow',
        deploy: false,
        address: '0xAf70ff11e339C3DC79f315e05BbD6015B7bDFEf5',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.BORROW,
        history: ['0x79d428e563D946DaBe43C681f92c8D714F5157cE'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Withdraw: {
        name: 'AaveV3Withdraw',
        deploy: false,
        address: '0xFBcB0bf3A7BcD1a368e8e8Ad2Ab601160088b39C',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.WITHDRAW,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Deposit: {
        name: 'AaveV3Deposit',
        deploy: false,
        address: '0x53546083A3C8841e0813C6800e19F7E736585D31',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.DEPOSIT,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Payback: {
        name: 'AaveV3Payback',
        deploy: false,
        address: '0x35909F6e5C36224fb44C4B448F051Fd474feDA89',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.PAYBACK,
        history: ['0x0835703172ad872561Ea667073A71561C5910Cca'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3SetEMode: {
        name: 'AaveV3SetEMode',
        deploy: false,
        address: '0x9F47b484E921619028eF1c6F7fE73F9921B5AC6D',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.SET_EMODE,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AjnaDepositBorrow: {
        name: 'AjnaDepositBorrow',
        deploy: false,
        address: '0x4C020189Ed0556bD934F6d459003c95706b2D71d',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.DEPOSIT_BORROW,
        history: [
          '0xb2e2a088d9705cd412CE6BF94e765743Ec26b1e4',
          '0x0f57A087d7138DE78F2a727C62c06a779450aE68',
          '0x0b1A4822784648b8aD1D16926Db2a20eb9A41B41',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AjnaRepayWithdraw: {
        name: 'AjnaRepayWithdraw',
        deploy: false,
        address: '0x595e9375bF40f2B9112c21b3Ded4e06cF3641982',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.REPAY_WITHDRAW,
        history: [
          '0x1631FAF05bfFA2200698d71893667C9De1E221fc',
          '0xb26e526A5B1C4A3aE3d4d24e1748df3ff53209d4',
          '0x3A2756376b9a949f7Eca58e73A2D27015AFC594B',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      MorphoBlueBorrow: {
        name: 'MorphoBlueBorrow',
        deploy: false,
        address: '0x227B72A64FAC7597A7838034e774eAfeF95b4Ac5',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.BORROW,
        history: ['0x0000000000000000000000000000000000000000'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      MorphoBlueWithdraw: {
        name: 'MorphoBlueWithdraw',
        deploy: false,
        address: '0xe3EdfDaB49ac6756f3A9A6922Ae2c52990da6188',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.WITHDRAW,
        history: ['0x0000000000000000000000000000000000000000'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      MorphoBlueDeposit: {
        name: 'MorphoBlueDeposit',
        deploy: false,
        address: '0x5b8e9D4FE8f8AdF162Fc8bA12f7a93811F7BBc8c',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.DEPOSIT,
        history: ['0x0000000000000000000000000000000000000000'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      MorphoBluePayback: {
        name: 'MorphoBluePayback',
        deploy: false,
        address: '0x717175C1A85351a838eC919D105f58A25faf93e6',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.PAYBACK,
        history: ['0x0000000000000000000000000000000000000000'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      MorphoBlueClaimRewards: {
        name: 'MorphoBlueClaimRewards',
        deploy: false,
        address: '0x1Be2FE53fc29B411319f3b1E1d0748B79b898b51',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.CLAIM_REWARDS,
        history: [],
        constructorArgs: [],
      },
    },
  },
  common: {
    ...commonDefaults,
    DEGEN: {
      name: 'DEGEN',
      address: '0x4ed4e862860bed51a9570b96d89af5e1b0efefed',
    },
    CUSDCV3: {
      name: 'CUSDCV3',
      address: '0xb125e6687d4313864e53df431d5425969c15eb2f',
    },
    SNX: {
      name: 'SNX',
      address: '0x22e6966B799c4D5B13BE962E1D117b56327FDa66',
    },
    ARB: {
      name: 'ARB',
      address: '0x0000000000000000000000000000000000000000',
    },
    CRV: {
      name: 'CRV',
      address: '0x0000000000000000000000000000000000000000',
    },
    OP: {
      name: 'OP',
      address: '0x0000000000000000000000000000000000000000',
    },
    SUSD: {
      name: 'SUSD',
      address: '0x0000000000000000000000000000000000000000',
    },
    RPL: {
      name: 'RPL',
      address: '0x0000000000000000000000000000000000000000',
    },
    SUSDE: {
      name: 'SUSDE',
      address: '0x0000000000000000000000000000000000000000',
    },
    CSETH: {
      name: 'CSETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    DETH: {
      name: 'DETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    EZETH: {
      name: 'EZETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    MEVETH: {
      name: 'MEVETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    MPETH: {
      name: 'MPETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    UNIETH: {
      name: 'UNIETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    XETH: {
      name: 'XETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    GnosisSafe: {
      name: 'GnosisSafe',
      address: '0x0000000000000000000000000000000000000000',
    },
    UniswapRouterV3: {
      name: 'UniswapRouterV3',
      address: '0x0000000000000000000000000000000000000000',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.UNISWAP_ROUTER,
    },
    BalancerVault: {
      name: 'BalancerVault',
      address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.BALANCER_VAULT,
    },
    FeeRecipient: {
      name: 'FeeRecipient',
      address: '0x0000000000000000000000000000000000000000',
    },
    AuthorizedCaller: {
      name: 'AuthorizedCaller',
      address: '0x0000000000000000000000000000000000000000',
    },
    OneInchAggregator: {
      name: 'OneInchAggregator',
      address: '0x1111111254eeb25477b68fb85ed929f73a960582',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ONE_INCH_AGGREGATOR,
    },
    MerkleRedeemer: {
      name: 'MerkleRedeemer',
      address: '0x0000000000000000000000000000000000000000',
    },
    DssCharter: {
      name: 'DssCharter',
      address: '0x0000000000000000000000000000000000000000',
    },
    DssProxyActions: {
      name: 'DssProxyActions',
      address: '0x0000000000000000000000000000000000000000',
    },
    DssProxyActionsCharter: {
      name: 'DssProxyActionsCharter',
      address: '0x0000000000000000000000000000000000000000',
    },
    DssMultiplyProxyActions: {
      name: 'DssMultiplyProxyActions',
      address: '0x0000000000000000000000000000000000000000',
    },
    DssCropper: {
      name: 'DssCropper',
      address: '0x0000000000000000000000000000000000000000',
    },
    DssProxyActionsCropjoin: {
      name: 'DssProxyActionsCropjoin',
      address: '0x0000000000000000000000000000000000000000',
    },
    DssProxyActionsDsr: {
      name: 'DssProxyActionsDsr',
      address: '0x0000000000000000000000000000000000000000',
    },
    Otc: {
      name: 'Otc',
      address: '0x0000000000000000000000000000000000000000',
    },
    OtcSupportMethods: {
      name: 'OtcSupportMethods',
      address: '0x0000000000000000000000000000000000000000',
    },
    ServiceRegistry: {
      name: 'ServiceRegistry',
      address: '0x0000000000000000000000000000000000000000',
    },
    GuniProxyActions: {
      name: 'GuniProxyActions',
      address: '0x0000000000000000000000000000000000000000',
    },
    GuniResolver: {
      name: 'GuniResolver',
      address: '0x0000000000000000000000000000000000000000',
    },
    GuniRouter: {
      name: 'GuniRouter',
      address: '0x0000000000000000000000000000000000000000',
    },
    CdpRegistry: {
      name: 'CdpRegistry',
      address: '0x0000000000000000000000000000000000000000',
    },
    DefaultExchange: {
      name: 'DefaultExchange',
      address: '0x0000000000000000000000000000000000000000',
    },
    NoFeesExchange: {
      name: 'NoFeesExchange',
      address: '0x0000000000000000000000000000000000000000',
    },
    LowerFeesExchange: {
      name: 'LowerFeesExchange',
      address: '0x0000000000000000000000000000000000000000',
    },
    LidoCrvLiquidityFarmingReward: {
      name: 'LidoCrvLiquidityFarmingReward',
      address: '0x0000000000000000000000000000000000000000',
    },
    ChainlinkPriceOracle_USDCUSD: {
      name: 'ChainlinkPriceOracle_USDCUSD',
      address: '0x0000000000000000000000000000000000000000',
    },
    ChainlinkPriceOracle_ETHUSD: {
      name: 'ChainlinkPriceOracle_ETHUSD',
      address: '0x0000000000000000000000000000000000000000',
    },
    SdaiOracle: {
      name: 'SdaiOracle',
      address: '0x0000000000000000000000000000000000000000',
    },
    WSTETHOracle: {
      name: 'WSTETHOracle',
      address: '0x0000000000000000000000000000000000000000',
    },
    ADAI: {
      name: 'ADAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AAVE: {
      name: 'AAVE',
      address: '0x0000000000000000000000000000000000000000',
    },
    AERO: {
      name: 'AERO',
      address: '0x940181a94a35a4569e4529a3cdfb74e38fd98631',
    },
    AJNA: {
      name: 'AJNA',
      address: '0x0000000000000000000000000000000000000000',
    },
    APXETH: {
      name: 'APXETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    BAL: {
      name: 'BAL',
      address: '0x0000000000000000000000000000000000000000',
    },
    BAT: {
      name: 'BAT',
      address: '0x0000000000000000000000000000000000000000',
    },
    BWAJNA: {
      name: 'BWAJNA',
      address: '0xf0f326af3b1Ed943ab95C29470730CC8Cf66ae47',
    },
    COMP: {
      name: 'COMP',
      address: '0x0000000000000000000000000000000000000000',
    },
    CBETH: {
      name: 'CBETH',
      address: '0x2ae3f1ec7f1f5012cfeab0185bfc7aa3cf0dec22',
    },
    CRVV1ETHSTETH: {
      name: 'CRVV1ETHSTETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    DAI: {
      name: 'DAI',
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DAI,
    },
    ETH: {
      name: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    },
    FRAX: {
      name: 'FRAX',
      address: '0x0000000000000000000000000000000000000000',
    },
    GHO: {
      name: 'GHO',
      address: '0x0000000000000000000000000000000000000000',
    },
    GNO: {
      name: 'GNO',
      address: '0x0000000000000000000000000000000000000000',
    },
    GUNIV3DAIUSDC1: {
      name: 'GUNIV3DAIUSDC1',
      address: '0x0000000000000000000000000000000000000000',
    },
    GUNIV3DAIUSDC2: {
      name: 'GUNIV3DAIUSDC2',
      address: '0x0000000000000000000000000000000000000000',
    },
    GUSD: {
      name: 'GUSD',
      address: '0x0000000000000000000000000000000000000000',
    },
    KNC: {
      name: 'KNC',
      address: '0x0000000000000000000000000000000000000000',
    },
    LDO: {
      name: 'LDO',
      address: '0x0000000000000000000000000000000000000000',
    },
    LINK: {
      name: 'LINK',
      address: '0x0000000000000000000000000000000000000000',
    },
    LRC: {
      name: 'LRC',
      address: '0x0000000000000000000000000000000000000000',
    },
    LUSD: {
      name: 'LUSD',
      address: '0x0000000000000000000000000000000000000000',
    },
    MANA: {
      name: 'MANA',
      address: '0x0000000000000000000000000000000000000000',
    },
    MATIC: {
      name: 'MATIC',
      address: '0x0000000000000000000000000000000000000000',
    },
    MORPHO: {
      name: 'MORPHO',
      address: ADDRESS_ZERO,
    },
    OSETH: {
      name: 'OSETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    PAX: {
      name: 'PAX',
      address: '0x0000000000000000000000000000000000000000',
    },
    PAXUSD: {
      name: 'PAXUSD',
      address: '0x0000000000000000000000000000000000000000',
    },
    PRIME: {
      name: 'PRIME',
      address: '0xfa980ced6895ac314e7de34ef1bfae90a5add21b',
    },
    RENBTC: {
      name: 'RENBTC',
      address: '0x0000000000000000000000000000000000000000',
    },
    RETH: {
      name: 'RETH',
      address: '0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c',
    },
    RBN: {
      name: 'RBN',
      address: '0x0000000000000000000000000000000000000000',
    },
    RWA001: {
      name: 'RWA001',
      address: '0x0000000000000000000000000000000000000000',
    },
    RWA002: {
      name: 'RWA002',
      address: '0x0000000000000000000000000000000000000000',
    },
    RWA003: {
      name: 'RWA003',
      address: '0x0000000000000000000000000000000000000000',
    },
    RWA004: {
      name: 'RWA004',
      address: '0x0000000000000000000000000000000000000000',
    },
    RWA005: {
      name: 'RWA005',
      address: '0x0000000000000000000000000000000000000000',
    },
    RWA006: {
      name: 'RWA006',
      address: '0x0000000000000000000000000000000000000000',
    },
    SDAI: {
      name: 'SDAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    STETH: {
      name: 'STETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    STYETH: {
      name: 'STYETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    TBTC: {
      name: 'TBTC',
      address: '0x0000000000000000000000000000000000000000',
    },
    TUSD: {
      name: 'TUSD',
      address: '0x0000000000000000000000000000000000000000',
    },
    UNI: {
      name: 'UNI',
      address: '0x0000000000000000000000000000000000000000',
    },
    UNIV2AAVEETH: {
      name: 'UNIV2AAVEETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    UNIV2DAIETH: {
      name: 'UNIV2DAIETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    UNIV2DAIUSDC: {
      name: 'UNIV2DAIUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    UNIV2DAIUSDT: {
      name: 'UNIV2DAIUSDT',
      address: '0x0000000000000000000000000000000000000000',
    },
    UNIV2ETHUSDT: {
      name: 'UNIV2ETHUSDT',
      address: '0x0000000000000000000000000000000000000000',
    },
    UNIV2LINKETH: {
      name: 'UNIV2LINKETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    UNIV2UNIETH: {
      name: 'UNIV2UNIETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    UNIV2USDCETH: {
      name: 'UNIV2USDCETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    UNIV2WBTCDAI: {
      name: 'UNIV2WBTCDAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    UNIV2WBTCETH: {
      name: 'UNIV2WBTCETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    USDC: {
      name: 'USDC',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    'USDC.E': {
      name: 'USDC.E',
      address: '0x0000000000000000000000000000000000000000',
    },
    USDT: {
      name: 'USDT',
      address: '0x0000000000000000000000000000000000000000',
    },
    USDBC: {
      name: 'USDBC',
      address: '0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca',
    },
    WBTC: {
      name: 'WBTC',
      address: '0x0000000000000000000000000000000000000000',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WBTC,
    },
    WETH: {
      name: 'WETH',
      address: '0x4200000000000000000000000000000000000006',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WETH,
    },
    WLD: {
      name: 'WLD',
      address: '0x0000000000000000000000000000000000000000',
    },
    WSTETH: {
      name: 'WSTETH',
      address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WSTETH,
    },
    WEETH: {
      name: 'WEETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    YIELDBTC: {
      name: 'YIELDBTC',
      address: '0x0000000000000000000000000000000000000000',
    },
    YIELDETH: {
      name: 'YIELDETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    YFI: {
      name: 'YFI',
      address: '0x9EaF8C1E34F05a589EDa6BAfdF391Cf6Ad3CB239',
    },
    ZRX: {
      name: 'ZRX',
      address: '0x0000000000000000000000000000000000000000',
    },
  },
  aave: {
    v2: {
      Oracle: {
        name: 'Oracle',
        address: '0x0000000000000000000000000000000000000000',
      },
      LendingPool: {
        name: 'LendingPool',
        address: '0x0000000000000000000000000000000000000000',
      },
      PoolDataProvider: {
        name: 'PoolDataProvider',
        address: '0x0000000000000000000000000000000000000000',
      },
      WETHGateway: {
        name: 'WETHGateway',
        address: '0x0000000000000000000000000000000000000000',
      },
    },
    v3: {
      Oracle: {
        name: 'Oracle',
        address: '0x2Cc0Fc26eD4563A5ce5e8bdcfe1A2878676Ae156',
      },
      LendingPool: {
        name: 'LendingPool',
        address: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.AAVE_POOL,
      },
      PoolDataProvider: {
        name: 'PoolDataProvider',
        address: '0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac',
      },
      L2Encoder: {
        name: 'L2Encoder',
        address: '0x39e97c588B2907Fb67F44fea256Ae3BA064207C5',
      },
    },
  },
  spark: {},
  maker: {
    common: {
      FlashMintModule: {
        name: 'FlashMintModule',
        address: '0x0000000000000000000000000000000000000000',
      },
      Chainlog: {
        name: 'Chainlog',
        address: '0x0000000000000000000000000000000000000000',
      },
      CdpManager: {
        name: 'CdpManager',
        address: '0x0000000000000000000000000000000000000000',
      },
      GetCdps: {
        name: 'GetCdps',
        address: '0x0000000000000000000000000000000000000000',
      },
      Jug: {
        name: 'Jug',
        address: '0x0000000000000000000000000000000000000000',
      },
      Pot: {
        name: 'Pot',
        address: '0x0000000000000000000000000000000000000000',
      },
      End: {
        name: 'End',
        address: '0x0000000000000000000000000000000000000000',
      },
      Spot: {
        name: 'Spot',
        address: '0x0000000000000000000000000000000000000000',
      },
      Dog: {
        name: 'Dog',
        address: '0x0000000000000000000000000000000000000000',
      },
      Vat: {
        name: 'Vat',
        address: '0x0000000000000000000000000000000000000000',
      },
      McdGov: {
        name: 'McdGov',
        address: '0x0000000000000000000000000000000000000000',
      },
    },
    joins: {
      MCD_JOIN_DAI: {
        name: 'MCD_JOIN_DAI',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_ETH_A: {
        name: 'MCD_JOIN_ETH_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_ETH_B: {
        name: 'MCD_JOIN_ETH_B',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_ETH_C: {
        name: 'MCD_JOIN_ETH_C',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_BAT_A: {
        name: 'MCD_JOIN_BAT_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_USDC_A: {
        name: 'MCD_JOIN_USDC_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_USDC_B: {
        name: 'MCD_JOIN_USDC_B',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_PSM_USDC_A: {
        name: 'MCD_JOIN_PSM_USDC_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_TUSD_A: {
        name: 'MCD_JOIN_TUSD_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_WBTC_A: {
        name: 'MCD_JOIN_WBTC_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_WBTC_B: {
        name: 'MCD_JOIN_WBTC_B',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_WBTC_C: {
        name: 'MCD_JOIN_WBTC_C',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_ZRX_A: {
        name: 'MCD_JOIN_ZRX_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_KNC_A: {
        name: 'MCD_JOIN_KNC_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_MANA_A: {
        name: 'MCD_JOIN_MANA_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_USDT_A: {
        name: 'MCD_JOIN_USDT_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_PAXUSD_A: {
        name: 'MCD_JOIN_PAXUSD_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_PSM_PAX_A: {
        name: 'MCD_JOIN_PSM_PAX_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_COMP_A: {
        name: 'MCD_JOIN_COMP_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_LRC_A: {
        name: 'MCD_JOIN_LRC_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_LINK_A: {
        name: 'MCD_JOIN_LINK_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_BAL_A: {
        name: 'MCD_JOIN_BAL_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_YFI_A: {
        name: 'MCD_JOIN_YFI_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_GUSD_A: {
        name: 'MCD_JOIN_GUSD_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_PSM_GUSD_A: {
        name: 'MCD_JOIN_PSM_GUSD_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_UNI_A: {
        name: 'MCD_JOIN_UNI_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_RENBTC_A: {
        name: 'MCD_JOIN_RENBTC_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_AAVE_A: {
        name: 'MCD_JOIN_AAVE_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_MATIC_A: {
        name: 'MCD_JOIN_MATIC_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_WSTETH_A: {
        name: 'MCD_JOIN_WSTETH_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_WSTETH_B: {
        name: 'MCD_JOIN_WSTETH_B',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_UNIV2DAIETH_A: {
        name: 'MCD_JOIN_UNIV2DAIETH_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_UNIV2WBTCETH_A: {
        name: 'MCD_JOIN_UNIV2WBTCETH_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_UNIV2USDCETH_A: {
        name: 'MCD_JOIN_UNIV2USDCETH_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_UNIV2DAIUSDC_A: {
        name: 'MCD_JOIN_UNIV2DAIUSDC_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_UNIV2ETHUSDT_A: {
        name: 'MCD_JOIN_UNIV2ETHUSDT_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_UNIV2LINKETH_A: {
        name: 'MCD_JOIN_UNIV2LINKETH_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_UNIV2UNIETH_A: {
        name: 'MCD_JOIN_UNIV2UNIETH_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_UNIV2WBTCDAI_A: {
        name: 'MCD_JOIN_UNIV2WBTCDAI_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_UNIV2AAVEETH_A: {
        name: 'MCD_JOIN_UNIV2AAVEETH_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_UNIV2DAIUSDT_A: {
        name: 'MCD_JOIN_UNIV2DAIUSDT_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_RWA001_A: {
        name: 'MCD_JOIN_RWA001_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_RWA002_A: {
        name: 'MCD_JOIN_RWA002_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_RWA003_A: {
        name: 'MCD_JOIN_RWA003_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_RWA004_A: {
        name: 'MCD_JOIN_RWA004_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_RWA005_A: {
        name: 'MCD_JOIN_RWA005_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_RWA006_A: {
        name: 'MCD_JOIN_RWA006_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_RETH_A: {
        name: 'MCD_JOIN_RETH_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_GNO_A: {
        name: 'MCD_JOIN_GNO_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_DIRECT_AAVEV2_DAI: {
        name: 'MCD_JOIN_DIRECT_AAVEV2_DAI',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_GUNIV3DAIUSDC1_A: {
        name: 'MCD_JOIN_GUNIV3DAIUSDC1_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_GUNIV3DAIUSDC2_A: {
        name: 'MCD_JOIN_GUNIV3DAIUSDC2_A',
        address: '0x0000000000000000000000000000000000000000',
      },
      MCD_JOIN_CRVV1ETHSTETH_A: {
        name: 'MCD_JOIN_CRVV1ETHSTETH_A',
        address: '0x0000000000000000000000000000000000000000',
      },
    },
    pips: {
      PIP_ETH: {
        name: 'PIP_ETH',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_BAT: {
        name: 'PIP_BAT',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_USDC: {
        name: 'PIP_USDC',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_WBTC: {
        name: 'PIP_WBTC',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_TUSD: {
        name: 'PIP_TUSD',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_ZRX: {
        name: 'PIP_ZRX',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_KNC: {
        name: 'PIP_KNC',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_MANA: {
        name: 'PIP_MANA',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_USDT: {
        name: 'PIP_USDT',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_PAXUSD: {
        name: 'PIP_PAXUSD',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_PAX: {
        name: 'PIP_PAX',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_COMP: {
        name: 'PIP_COMP',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_LRC: {
        name: 'PIP_LRC',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_LINK: {
        name: 'PIP_LINK',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_BAL: {
        name: 'PIP_BAL',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_YFI: {
        name: 'PIP_YFI',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_GUSD: {
        name: 'PIP_GUSD',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_UNI: {
        name: 'PIP_UNI',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_RENBTC: {
        name: 'PIP_RENBTC',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_AAVE: {
        name: 'PIP_AAVE',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_MATIC: {
        name: 'PIP_MATIC',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_WSTETH: {
        name: 'PIP_WSTETH',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_ADAI: {
        name: 'PIP_ADAI',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_UNIV2DAIETH: {
        name: 'PIP_UNIV2DAIETH',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_UNIV2WBTCETH: {
        name: 'PIP_UNIV2WBTCETH',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_UNIV2USDCETH: {
        name: 'PIP_UNIV2USDCETH',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_UNIV2DAIUSDC: {
        name: 'PIP_UNIV2DAIUSDC',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_UNIV2ETHUSDT: {
        name: 'PIP_UNIV2ETHUSDT',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_UNIV2LINKETH: {
        name: 'PIP_UNIV2LINKETH',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_UNIV2UNIETH: {
        name: 'PIP_UNIV2UNIETH',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_UNIV2WBTCDAI: {
        name: 'PIP_UNIV2WBTCDAI',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_UNIV2AAVEETH: {
        name: 'PIP_UNIV2AAVEETH',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_UNIV2DAIUSDT: {
        name: 'PIP_UNIV2DAIUSDT',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_GUNIV3DAIUSDC1: {
        name: 'PIP_GUNIV3DAIUSDC1',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_GUNIV3DAIUSDC2: {
        name: 'PIP_GUNIV3DAIUSDC2',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_CRVV1ETHSTETH: {
        name: 'PIP_CRVV1ETHSTETH',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_RWA001: {
        name: 'PIP_RWA001',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_RWA002: {
        name: 'PIP_RWA002',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_RWA003: {
        name: 'PIP_RWA003',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_RWA004: {
        name: 'PIP_RWA004',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_RWA005: {
        name: 'PIP_RWA005',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_RWA006: {
        name: 'PIP_RWA006',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_RETH: {
        name: 'PIP_RETH',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_GNO: {
        name: 'PIP_GNO',
        address: '0x0000000000000000000000000000000000000000',
      },
      PIP_WETH: {
        name: 'PIP_WETH',
        address: '0x0000000000000000000000000000000000000000',
      },
    },
  },
  automation: {
    AutomationBot: {
      name: 'AutomationBot',
      address: '0x0000000000000000000000000000000000000000',
    },
    AutomationBotV2: {
      name: 'AutomationBotV2',
      address: '0x96D494b4544Bb7c3CB687ef7a9886Ed469e01ed8',
    },
    AutomationBotAggregator: {
      name: 'AutomationBotAggregator',
      address: '0x0000000000000000000000000000000000000000',
    },
  },
  ajna: {
    ...emptyAjnaPools,
    AjnaPoolPairs_AJNADAI: {
      name: 'AjnaPoolPairs_AJNADAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_APXETHETH: {
      name: 'AjnaPoolPairs_APXETHETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_CBETHETH: {
      name: 'AjnaPoolPairs_CBETHETH',
      address: '0xCB1953EE28f89731C0ec088dA0720FC282fCFa9c',
    },
    AjnaPoolPairs_CBETHGHO: {
      name: 'AjnaPoolPairs_CBETHGHO',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_CBETHUSDBC: {
      name: 'AjnaPoolPairs_CBETHUSDBC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_ETHDAI: {
      name: 'AjnaPoolPairs_ETHDAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_ETHGHO: {
      name: 'AjnaPoolPairs_ETHGHO',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_ETHUSDC: {
      name: 'AjnaPoolPairs_ETHUSDC',
      address: '0x0B17159F2486f669a1F930926638008E2ccB4287',
    },
    AjnaPoolPairs_GHODAI: {
      name: 'AjnaPoolPairs_GHODAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_MKRDAI: {
      name: 'AjnaPoolPairs_MKRDAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_MWSTETHWPUNKS20WSTETH: {
      name: 'AjnaPoolPairs_MWSTETHWPUNKS20WSTETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_MWSTETHWPUNKS40WSTETH: {
      name: 'AjnaPoolPairs_MWSTETHWPUNKS40WSTETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_RETHDAI: {
      name: 'AjnaPoolPairs_RETHDAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_RETHETH: {
      name: 'AjnaPoolPairs_RETHETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_RETHGHO: {
      name: 'AjnaPoolPairs_RETHGHO',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_RETHUSDC: {
      name: 'AjnaPoolPairs_RETHUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_RBNETH: {
      name: 'AjnaPoolPairs_RBNETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_SDAIUSDC: {
      name: 'AjnaPoolPairs_SDAIUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_STYETHDAI: {
      name: 'AjnaPoolPairs_STYETHDAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_SUSDEDAI: {
      name: 'AjnaPoolPairs_SUSDEDAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_TBTCGHO: {
      name: 'AjnaPoolPairs_TBTCGHO',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_TBTCUSDC: {
      name: 'AjnaPoolPairs_TBTCUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_TBTCWBTC: {
      name: 'AjnaPoolPairs_TBTCWBTC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_USDCDAI: {
      name: 'AjnaPoolPairs_USDCDAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_USDCETH: {
      name: 'AjnaPoolPairs_USDCETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_USDCWLD: {
      name: 'AjnaPoolPairs_USDCWLD',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_USDCWBTC: {
      name: 'AjnaPoolPairs_USDCWBTC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_WBTCDAI: {
      name: 'AjnaPoolPairs_WBTCDAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_WBTCGHO: {
      name: 'AjnaPoolPairs_WBTCGHO',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_WBTCUSDC: {
      name: 'AjnaPoolPairs_WBTCUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_WLDUSDC: {
      name: 'AjnaPoolPairs_WLDUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_WSTETHDAI: {
      name: 'AjnaPoolPairs_WSTETHDAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_WSTETHETH: {
      name: 'AjnaPoolPairs_WSTETHETH',
      address: '0x63A366fc5976FF72999C89f69366F388b7D233e8',
    },
    AjnaPoolPairs_WSTETHGHO: {
      name: 'AjnaPoolPairs_WSTETHGHO',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_WSTETHUSDC: {
      name: 'AjnaPoolPairs_WSTETHUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_YFIDAI: {
      name: 'AjnaPoolPairs_YFIDAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_YIELDBTCWBTC: {
      name: 'AjnaPoolPairs_YIELDBTCWBTC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_YIELDETHETH: {
      name: 'AjnaPoolPairs_YIELDETHETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_YVCURVEUSDMSDAIFDAI: {
      name: 'AjnaPoolPairs_YVCURVEUSDMSDAIFDAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_ARBETH: {
      name: 'AjnaPoolPairs_ARBETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_ARBUSDC: {
      name: 'AjnaPoolPairs_ARBUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_OPETH: {
      name: 'AjnaPoolPairs_OPETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_OPUSDC: {
      name: 'AjnaPoolPairs_OPUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_MEVETHWETH: {
      name: 'AjnaPoolPairs_MEVETHWETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_XETHWETH: {
      name: 'AjnaPoolPairs_XETHWETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_CSETHWETH: {
      name: 'AjnaPoolPairs_CSETHWETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_APXETHWETH: {
      name: 'AjnaPoolPairs_APXETHWETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_DETHWETH: {
      name: 'AjnaPoolPairs_DETHWETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_UNIETHWETH: {
      name: 'AjnaPoolPairs_UNIETHWETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_MPETHWETH: {
      name: 'AjnaPoolPairs_MPETHWETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_EZETHWETH: {
      name: 'AjnaPoolPairs_EZETHWETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_DEGENUSDC: {
      name: 'AjnaPoolPairs_DEGENUSDC',
      address: '0x52e69a7cf5076a769e11fffc2e99e837b575f65e',
    },
    AjnaPoolPairs_DEGENCUSDCV3: {
      name: 'AjnaPoolPairs_DEGENCUSDCV3',
      address: '0x343F462B050975005c388AE3eA62e4C1FC418C64',
    },
    AjnaPoolPairs_USDCDEGEN: {
      name: 'AjnaPoolPairs_USDCDEGEN',
      address: '0x1dec31e6550c958af3e116f23472fe1493476496',
    },
    AjnaPoolPairs_SNXUSDC: {
      name: 'AjnaPoolPairs_SNXUSDC',
      address: '0x92c85b18e7f0df000bbfab4ce76c28a4ddbae64a',
    },
    AjnaPoolPairs_SNXCUSDCV3: {
      name: 'AjnaPoolPairs_SNXCUSDCV3',
      address: '0x7B1a82Ac53935884c22187B5fd219d310428D9b5',
    },
    AjnaPoolPairs_AEROUSDC: {
      name: 'AjnaPoolPairs_AEROUSDC',
      address: '0x97dbbdba28df6d629bc17e0349bcb73d541ed041',
    },
    AjnaPoolPairs_PRIMEUSDC: {
      name: 'AjnaPoolPairs_PRIMEUSDC',
      address: '0x2b2b94dc8e974433c7c4ec7741f686eb46584831',
    },
    AjnaPoolPairs_SUSDCYUSDC: {
      name: 'AjnaPoolPairs_SUSDCYUSDC',
      address: '0xebd79bdded542c3cfa6912e53581e5bc4fea4616',
    },
    AjnaPoolInfo: {
      name: 'AjnaPoolInfo',
      address: '0x97fa9b0909C238D170C1ab3B5c728A3a45BBEcBa',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.AJNA_POOL_UTILS_INFO,
    },
    AjnaProxyActions: {
      name: 'AjnaProxyActions',
      address: '0x099708408aDb18F6D49013c88F3b1Bb514cC616F',
    },
    AjnaRewardsManager: {
      name: 'AjnaRewardsManager',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaRewardsClaimer: {
      name: 'AjnaRewardsClaimer',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaRewardsReedemer: {
      name: 'AjnaRewardsReedemer',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaBonusRewardsReedemer: {
      name: 'AjnaBonusRewardsReedemer',
      address: '0x0000000000000000000000000000000000000000',
    },
    ERC20PoolFactory: {
      name: 'ERC20PoolFactory',
      address: '0x214f62B5836D83f3D6c4f71F174209097B1A779C',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.ERC20_POOL_FACTORY,
    },
  },
  morphoblue: {
    MorphoBlue: {
      name: 'MorphoBlue',
      address: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.MORPHO_BLUE,
    },
    AdaptiveCurveIrm: {
      name: 'AdaptiveCurveIrm',
      address: '0x46415998764C29aB2a25CbeA6254146D50D22687',
    },
  },
}
