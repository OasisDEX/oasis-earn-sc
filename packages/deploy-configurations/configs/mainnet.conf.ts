import { loadContractNames } from '@deploy-configurations/constants'
import { SystemConfig } from '@deploy-configurations/types/deployment-config'
import { Network } from '@deploy-configurations/types/network'

const SERVICE_REGISTRY_NAMES = loadContractNames(Network.MAINNET)

export const config: SystemConfig = {
  mpa: {
    core: {
      ServiceRegistry: {
        name: 'ServiceRegistry',
        deploy: false,
        address: '0x5e81a7515f956ab642eb698821a449fe8fe7498e',
        history: ['0x9b4Ae7b164d195df9C4Da5d08Be88b2848b2EaDA'],
        constructorArgs: [0],
      },
      OperationExecutor: {
        name: 'OperationExecutor',
        deploy: false,
        address: '0xcA71C36D26f515AD0cce1D806B231CBC1185CdfC',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATION_EXECUTOR,
        history: ['0xc1cd3654ab3b37e0bc26bafb5ae4c096892d0b0c'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      OperationStorage: {
        name: 'OperationStorage',
        deploy: false,
        address: '0xa67c8ED81562085894172746E9CC28b7c21F2277',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATION_STORAGE,
        history: ['0x66081bcDb3760f1Bf765B4D9800d0a059BBec73F'],
        constructorArgs: ['address:ServiceRegistry', 'address:OperationExecutor'],
      },
      OperationsRegistry: {
        name: 'OperationsRegistry',
        deploy: false,
        address: '0x563d2689fE89c78259dD7F694146BB93f6388A55',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.OPERATIONS_REGISTRY,
        history: ['0x01871C3cCfeDE29d2b998E7D1BF0eEEBD26d9c49'],
        constructorArgs: [],
      },
      DSProxyFactory: {
        name: 'DSProxyFactory',
        deploy: false,
        address: '0xA26e15C895EFc0616177B7c1e7270A4C7D51C997',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_PROXY_FACTORY,
        history: [],
        constructorArgs: [],
      },
      DSProxyRegistry: {
        name: 'DSProxyRegistry',
        deploy: false,
        address: '0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_PROXY_REGISTRY,
        history: [],
        constructorArgs: ['address:DSProxyFactory'],
      },
      DSGuardFactory: {
        name: 'DSGuardFactory',
        deploy: false,
        address: '0x5a15566417e6C1c9546523066500bDDBc53F88C7',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DS_GUARD_FACTORY,
        history: [],
        constructorArgs: [],
      },
      AccountGuard: {
        name: 'AccountGuard',
        deploy: false,
        address: '0xCe91349d2A4577BBd0fC91Fe6019600e047f2847',
        history: [],
        constructorArgs: [],
      },
      AccountFactory: {
        name: 'AccountFactory',
        deploy: false,
        address: '0xF7B75183A2829843dB06266c114297dfbFaeE2b6',
        history: [],
        constructorArgs: ['address:AccountGuard'],
      },
      ChainLogView: {
        name: 'ChainLogView',
        deploy: false,
        address: '0x4B323Eb2ece7fc1D81F1819c26A7cBD29975f75f',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.CHAINLOG_VIEWER,
        history: [],
        constructorArgs: ['0xdA0Ab1e0017DEbCd72Be8599041a2aa3bA7e740F'],
      },
      Swap: {
        name: 'Swap',
        deploy: false,
        address: '0x826E9f2E79cEEA850dF4d4757e0D12115A720D74',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SWAP,
        history: [],
        constructorArgs: [],
      },
      ERC20ProxyActions: {
        name: 'ERC20ProxyActions',
        deploy: false,
        address: '0x50A9ceC5AB2E2e0D350dACeb10bA769EbCbc49F3',
        history: [],
        constructorArgs: [],
      },
      AaveRewardsProxyActions: {
        name: 'AaveRewardsProxyActions',
        deploy: true,
        address: '0x1498fEb3731b3ED60443F67dB323f0807d887a4a',
        history: ['0x8aD75eFF83EbcB2E343b1b8d76eFBC796Cf38594'],
        constructorArgs: [],
      },
    },
    actions: {
      ERC4626Deposit: {
        name: 'ERC4626Deposit',
        deploy: false,
        address: '0x02862b2f3A728EffD4E4A176ea3d296983d0f1df',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ERC4626_DEPOSIT,
        history: ['0x0000000000000000000000000000000000000000'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      ERC4626Withdraw: {
        name: 'ERC4626Withdraw',
        deploy: false,
        address: '0x4D063cF85562Dd43f0434d397e510dd0291FC5Ae',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.ERC4626_WITHDRAW,
        history: ['0x0000000000000000000000000000000000000000'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      PositionCreated: {
        name: 'PositionCreated',
        deploy: false,
        address: '0x83FF13979C0B82934C3916532453A5d6be492e2E',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.POSITION_CREATED,
        history: ['0xA0Cb87300aB07D00468704cD8f016F8dE47D8E0A'],
        constructorArgs: [],
      },
      SwapAction: {
        name: 'SwapAction',
        deploy: false,
        address: '0x313617D9CcBd96d66b2374c9bcB44b372D29b530',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SWAP_ACTION,
        history: ['0x7E7EB65A93441a2D2Bf0941216b4c1116B554d85'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      TakeFlashloan: {
        name: 'TakeFlashloan',
        deploy: false,
        address: '0xbd4233fe84387b4070ef8947ae2816023fb21fed',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.TAKE_A_FLASHLOAN,
        history: ['0x0eD12441616ca97F5729Fff519F5e8d13d8De15F'],
        constructorArgs: [
          'address:ServiceRegistry',
          '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          '0x5a15566417e6C1c9546523066500bDDBc53F88C7',
        ],
      },
      SetApproval: {
        name: 'SetApproval',
        deploy: false,
        address: '0x3cf2e1ccd3cb586e19382fb1fbd720df7353dba5',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SET_APPROVAL,
        history: ['0xcEA79d9132d6446f0B59F194b22DB2a93dB4146c'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      PullToken: {
        name: 'PullToken',
        deploy: false,
        address: '0xe518b0cecc56f705788545c51f04f49d1fdca5cb',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.PULL_TOKEN,
        history: [
          '0x0bE3B9c118eD4eF2002Fd58d0d8cc8f7c76e168C',
          '0x73835b6c3179a7788df7fb6272fd69bba97907be',
        ],
        constructorArgs: [],
      },
      PullTokenMaxAmount: {
        name: 'PullTokenMaxAmount',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.PULL_TOKEN_MAX_AMOUNT,
        deploy: false,
        address: '0x3dA7A8EdAB8465438Ac0F5B542f111F12188A2cd',
        history: [],
        constructorArgs: [],
      },
      SendToken: {
        name: 'SendToken',
        deploy: false,
        address: '0xbf21f58e9c0dac0c3f9b26432d875ff8146ab255',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.SEND_TOKEN,
        history: ['0xAa4C55A8dd5b0e923056676D544FC20bb5D5e3A3'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      WrapEth: {
        name: 'WrapEth',
        deploy: false,
        address: '0x50db3ff917002c57e1494c376851620747aeba0b',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WRAP_ETH,
        history: ['0xafdD2e556Cef33C5C0033beB76E09b7Bd8d14Dec'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      UnwrapEth: {
        name: 'UnwrapEth',
        deploy: false,
        address: '0xc394d69580BA02baF457a47478E00A3f27a00B1a',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.UNWRAP_ETH,
        history: ['0xAC0B1652388Ea425884e6b60e2eD30155f43D50b'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      ReturnFunds: {
        name: 'ReturnFunds',
        deploy: false,
        address: '0xce74169AF94f67eB0eC48D5151012943fCa11Db4',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.RETURN_FUNDS,
        history: ['0x645325494A37d35cf6baFc82C3e6bcE4473F2685'],
        constructorArgs: [],
      },
      ReturnMultipleTokens: {
        name: 'ReturnMultipleTokens',
        deploy: false,
        address: '0xEAd2DF7334E9B6579B922749Db294b6D34d002b8',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.RETURN_MULTIPLE_TOKENS,
        history: [],
        constructorArgs: [],
      },
      TokenBalance: {
        name: 'TokenBalance',
        deploy: false,
        address: '0xe4c3add19f5a82b38b9f553122d8a890f81d652b',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.common.TOKEN_BALANCE,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveBorrow: {
        name: 'AaveBorrow',
        deploy: false,
        address: '0x0199E5B28FeFeDe94CfC7ec754e58F173219b4Cf',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.BORROW,
        history: ['0x6166B1587be6B954e660A71e4B083A5e0a5bF1b6'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveWithdraw: {
        name: 'AaveWithdraw',
        deploy: false,
        address: '0x7833fE8d3614a8248fd4762eE7FdFa9Bb24C0Ce9',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.WITHDRAW,
        history: ['0xECf6CaB5cD20F5f889e95A1A40d46607aa0F41Cf'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveDeposit: {
        name: 'AaveDeposit',
        deploy: false,
        address: '0xFdE9C559F877ff48350710946fe978dD16Ad35E9',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.DEPOSIT,
        history: ['0xFAf9D0B7B92e8B281CaF10b42970179B45CA6412'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AavePayback: {
        name: 'AavePayback',
        deploy: false,
        address: '0x45A19f6cea7aF9DF2833B0ce859616B10f6ADC7A',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.PAYBACK,
        history: ['0xeB54C366512c4d59A222A251ea7316568859E08C'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Borrow: {
        name: 'AaveV3Borrow',
        deploy: false,
        address: '0x2007f5e3b6734d16a425182c3df0995993febc3c',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.BORROW,
        history: [
          '0x18ca8bE41D32727383bC0F98705f7662ed0B7E28',
          '0x8a8c9Bad73369Fc12e6BF1EA09c76d37466C08d8',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Withdraw: {
        name: 'AaveV3Withdraw',
        deploy: false,
        address: '0xDA39737E1b15619D6eAC2eeFa2990277c9898ACE',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.WITHDRAW,
        history: ['0x414958801DC53E840501f507D7A0FEBE55806200'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Deposit: {
        name: 'AaveV3Deposit',
        deploy: false,
        address: '0xf70895f820551d5596A1c6Dd0999153d04FBC889',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.DEPOSIT,
        history: ['0x852c56859840487DcED2aF501fC06f7462C4f2a8'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Payback: {
        name: 'AaveV3Payback',
        deploy: false,
        address: '0x8ccf69d7d74ce35a843b222678346ccd766cff69',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.PAYBACK,
        history: [
          '0xdB736d13CE851Ee81ac2109DF37EBAb8Ce525C42',
          '0xeAc4F77ddA4Fe5396674a69a7f7865d87Fd7D5d1',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3SetEMode: {
        name: 'AaveV3SetEMode',
        deploy: false,
        address: '0xc6630a586211c3e47527e687Bd07fAE504149116',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.SET_EMODE,
        history: ['0xd4DB3799DEe98Fe752d952Ba6F84Bb99Af829920'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AjnaDepositBorrow: {
        name: 'AjnaDepositBorrow',
        deploy: false,
        address: '0x1b5A437A706778C14C0a4572e27A4bb9D94273f5',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.DEPOSIT_BORROW,
        history: [
          '0x4D6F457C8305A1E6f688a8a05C7341DD959cB681',
          '0x039F7784C5A6f187fcAc027262aA912974A7515D',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AjnaRepayWithdraw: {
        name: 'AjnaRepayWithdraw',
        deploy: false,
        address: '0xA6bD68Afa1dbc0D02F9839bD9eed04F73CaA114f',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.REPAY_WITHDRAW,
        history: [
          '0xc0BAFEa22AD2A2D92BF54B1d76eA175785aa9Eb1',
          '0x508E30f983d8a2F75154f7515f1163a7dE94C5A5',
        ],
        constructorArgs: ['address:ServiceRegistry'],
      },
      SparkBorrow: {
        name: 'SparkBorrow',
        deploy: false,
        address: '0x43b1CB94009A5F301bfC395b5B70694536c96908',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.spark.BORROW,
        history: ['0xc69156420307048c9BAAe8191f9012391521a88d'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      SparkWithdraw: {
        name: 'SparkWithdraw',
        deploy: false,
        address: '0x0cCa782002c4fE95e1ed7A75d41bB56bEfa0C167',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.spark.WITHDRAW,
        history: ['0x0000000000000000000000000000000000000000'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      SparkDeposit: {
        name: 'SparkDeposit',
        deploy: false,
        address: '0xC58F2Ee4Ef92F2bE314743442496D6Fad0339d56',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.spark.DEPOSIT,
        history: ['0x0000000000000000000000000000000000000000'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      SparkPayback: {
        name: 'SparkPayback',
        deploy: false,
        address: '0x8CcB5D70D4E8110312ddd6a64fE79FcD01e11B20',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.spark.PAYBACK,
        history: ['0x068875B4254aC431BE7B8a10C56D80324fA0d043'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      SparkSetEMode: {
        name: 'SparkSetEMode',
        deploy: false,
        address: '0x79d428e563D946DaBe43C681f92c8D714F5157cE',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.spark.SET_EMODE,
        history: ['0x0000000000000000000000000000000000000000'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      MorphoBlueBorrow: {
        name: 'MorphoBlueBorrow',
        deploy: false,
        address: '0x519A76090AF5952af5966F0c234B34eD1B59f07c',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.BORROW,
        history: ['0x0000000000000000000000000000000000000000'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      MorphoBlueWithdraw: {
        name: 'MorphoBlueWithdraw',
        deploy: false,
        address: '0x50241265F81a568a536a205F1F4bea8899Df9eFe',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.WITHDRAW,
        history: ['0x0000000000000000000000000000000000000000'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      MorphoBlueDeposit: {
        name: 'MorphoBlueDeposit',
        deploy: false,
        address: '0x839eeb8C62162f20f3B15163D4253e266C70f84f',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.DEPOSIT,
        history: ['0x0000000000000000000000000000000000000000'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      MorphoBluePayback: {
        name: 'MorphoBluePayback',
        deploy: false,
        address: '0xAA777F9A6a31ad862D688a6789c393014dA59770',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.PAYBACK,
        history: ['0x77f36e80BC366E6C13Cc7e8e1EB5dF8190D2bD8e'],
        constructorArgs: ['address:ServiceRegistry'],
      },
      MorphoBlueClaimRewards: {
        name: 'MorphoBlueClaimRewards',
        deploy: false,
        address: '0x8DA1109207Ed8e529Ba21Cd8187126053c07EC3E',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.morphoblue.CLAIM_REWARDS,
        history: [],
        constructorArgs: [],
      },
    },
  },
  common: {
    ARB: {
      name: 'ARB',
      address: '0x0000000000000000000000000000000000000000',
    },
    CRV: {
      name: 'CRV',
      address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
    },
    MKR: {
      name: 'MKR',
      address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    },
    OP: {
      name: 'OP',
      address: '0x0000000000000000000000000000000000000000',
    },
    SUSD: {
      name: 'SUSD',
      address: '0x0000000000000000000000000000000000000000',
    },
    SWBTC: {
      name: 'SWBTC',
      address: '0x8db2350d78abc13f5673a411d4700bcf87864dde',
    },
    USDE: {
      name: 'USDE',
      address: '0x4c9edd5852cd905f086c759e8383e09bff1e68b3',
    },
    RPL: {
      name: 'RPL',
      address: '0xd33526068d116ce69f19a9ee46f0bd304f21a51f',
    },
    SUSDE: {
      name: 'SUSDE',
      address: '0x9d39a5de30e57443bff2a8307a4256c8797a3497',
    },
    CSETH: {
      name: 'CSETH',
      address: '0x5d74468b69073f809d4fae90afec439e69bf6263',
    },
    DETH: {
      name: 'DETH',
      address: '0x3d1e5cf16077f349e999d6b21a4f646e83cd90c5',
    },
    EZETH: {
      name: 'EZETH',
      address: '0xbf5495efe5db9ce00f80364c8b423567e58d2110',
    },
    MEVETH: {
      name: 'MEVETH',
      address: '0x24ae2da0f361aa4be46b48eb19c91e02c5e4f27e',
    },
    MPETH: {
      name: 'MPETH',
      address: '0x48afbbd342f64ef8a9ab1c143719b63c2ad81710',
    },
    UNIETH: {
      name: 'UNIETH',
      address: '0xf1376bcef0f78459c0ed0ba5ddce976f1ddf51f4',
    },
    XETH: {
      name: 'XETH',
      address: '0xe063f04f280c60aeca68b38341c2eecbec703ae2',
    },
    PYUSD: {
      name: 'PYUSD',
      address: '0x6c3ea9036406852006290770bedfcaba0e23a0e8',
    },
    USDEOracle: {
      name: 'USDEOracle',
      address: '0xaE4750d0813B5E37A51f7629beedd72AF1f9cA35',
    },
    SUSDEOracle: {
      name: 'SUSDEOracle',
      address: '0x5D916980D5Ae1737a8330Bf24dF812b2911Aae25',
    },
    CRVUSD: {
      name: 'CRVUSD',
      address: '0xf939e0a03fb07f59a73314e73794be0e57ac1b4e',
    },
    AETHSDAI: {
      name: 'AETHSDAI',
      address: '0x4C612E3B15b96Ff9A6faED838F8d07d479a8dD4c',
    },
    AETHUSDC: {
      name: 'AETHUSDC',
      address: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
    },
    AETHUSDT: {
      name: 'AETHUSDT',
      address: '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a',
    },
    AETHDAI: {
      name: 'AETHDAI',
      address: '0x018008bfb33d285247A21d44E50697654f754e63',
    },
    AETHPYUSD: {
      name: 'AETHPYUSD',
      address: '0x0C0d01AbF3e6aDfcA0989eBbA9d6e85dD58EaB1E',
    },
    AETHLUSD: {
      name: 'AETHLUSD',
      address: '0x3Fe6a295459FAe07DF8A0ceCC36F37160FE86AA9',
    },
    AUSDC: {
      name: 'AUSDC',
      address: '0xBcca60bB61934080951369a648Fb03DF4F96263C',
    },
    AUSDT: {
      name: 'AUSDT',
      address: '0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811',
    },
    CUSDCV3: {
      name: 'CUSDCV3',
      address: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
    },
    CDAI: {
      name: 'CDAI',
      address: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
    },
    CUSDC: {
      name: 'CUSDC',
      address: '0x39AA39c021dfbaE8faC545936693aC917d5E7563',
    },
    AETHWSTETH: {
      name: 'AETHWSTETH',
      address: '0x0B925eD163218f6662a35e0f0371Ac234f9E9371',
    },
    AETHWETH: {
      name: 'AETHWETH',
      address: '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
    },
    AETHRETH: {
      name: 'AETHRETH',
      address: '0xCc9EE9483f662091a1de4795249E24aC0aC2630f',
    },
    AETHCBETH: {
      name: 'AETHCBETH',
      address: '0x977b6fc5dE62598B08C85AC8Cf2b745874E8b78c',
    },
    ASETH: {
      name: 'ASETH',
      address: '0x1982b2F5814301d4e9a8b0201555376e62F82428',
    },
    AWETH: {
      name: 'AWETH',
      address: '0x030bA81f1c18d280636F32af80b9AAd02Cf0854e',
    },
    CETH: {
      name: 'CETH',
      address: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    },
    BSDETH: {
      name: 'BSDETH',
      address: '0x0000000000000000000000000000000000000000',
    },
    CWETHV3: {
      name: 'CWETHV3',
      address: '0xA17581A9E3356d9A858b789D68B4d866e593aE94',
    },
    AETHWBTC: {
      name: 'AETHWBTC',
      address: '0x5Ee5bf7ae06D1Be5997A1A72006FE6C607eC6DE8',
    },
    AWBTC: {
      name: 'AWBTC',
      address: '0xFC4B8ED459e00e5400be803A9BB3954234FD50e3',
    },
    DEGEN: {
      name: 'DEGEN',
      address: '0x0000000000000000000000000000000000000000',
    },
    SNX: {
      name: 'SNX',
      address: '0x0000000000000000000000000000000000000000',
    },
    ENA: {
      name: 'ENA',
      address: '0x57e114b691db790c35207b2e685d4a43181e6061',
    },
    AERO: {
      name: 'AERO',
      address: '0x0000000000000000000000000000000000000000',
    },
    PRIME: {
      name: 'PRIME',
      address: '0x0000000000000000000000000000000000000000',
    },
    USDA: {
      name: 'USDA',
      address: '0x0000206329b97DB379d5E1Bf586BbDB969C63274',
    },
    SAFE: {
      name: 'SAFE',
      address: '0x5aFE3855358E112B5647B952709E6165e1c1eEEe',
    },
    PTWEETH: {
      name: 'PTWEETH',
      address: '0xc69ad9bab1dee23f4605a82b3354f8e40d1e5966',
    },
    WOETH: {
      name: 'WOETH',
      address: '0xdcee70654261af21c44c093c300ed3bb97b78192',
    },
    RSETH: {
      name: 'RSETH',
      address: '0xa1290d69c65a6fe4df752f95823fae25cb99e5a7',
    },
    'UNI-V2': {
      name: 'UNI-V2',
      address: '0x9fdd7f845baca6d71d93f1619250c6f0b7a58842',
    },
    SYRUPUSDC: {
      name: 'SYRUPUSDC',
      address: '0x80ac24aa929eaf5013f6436cda2a7ba190f5cc0b',
    },
    ChainlinkPriceOracle_BTCUSD: {
      name: 'ChainlinkPriceOracle_BTCUSD',
      address: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
    },
    RSWETH: {
      name: 'RSWETH',
      address: '0xFAe103DC9cf190eD75350761e95403b7b8aFa6c0',
    },
    LBTC: {
      name: 'LBTC',
      address: '0x8236a87084f8b84306f72007f36f2618a5634494',
    },
    WSUPEROETHB: {
      name: 'WSUPEROETHB',
      address: '0x0000000000000000000000000000000000000000',
    },
    GnosisSafe: {
      name: 'GnosisSafe',
      address: '0x85f9b7408afE6CEb5E46223451f5d4b832B522dc',
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
      address: '0xd9fabf81Ed15ea71FBAd0C1f77529a4755a38054',
    },
    DssCharter: { name: 'DssCharter', address: '0x0000123' },
    DssProxyActions: {
      name: 'DssProxyActions',
      address: '0x82ecD135Dce65Fbc6DbdD0e4237E0AF93FFD5038',
    },
    DssProxyActionsCharter: { name: 'DssProxyActionsCharter', address: '0x0000' },
    DssMultiplyProxyActions: {
      name: 'DssMultiplyProxyActions',
      address: '0x2a49eae5cca3f050ebec729cf90cc910fadaf7a2',
    },
    DssCropper: {
      name: 'DssCropper',
      address: '0x8377CD01a5834a6EaD3b7efb482f678f2092b77e',
    },
    DssProxyActionsCropjoin: {
      name: 'DssProxyActionsCropjoin',
      address: '0xa2f69F8B9B341CFE9BfBb3aaB5fe116C89C95bAF',
    },
    DssProxyActionsDsr: {
      name: 'DssProxyActionsDsr',
      address: '0x07ee93aEEa0a36FfF2A9B95dd22Bd6049EE54f26',
    },
    Otc: {
      name: 'Otc',
      address: '0x794e6e91555438aFc3ccF1c5076A74F42133d08D',
    },
    OtcSupportMethods: {
      name: 'OtcSupportMethods',
      address: '0x9b3f075b12513afe56ca2ed838613b7395f57839',
    },
    ServiceRegistry: {
      name: 'ServiceRegistry',
      address: '0x9b4Ae7b164d195df9C4Da5d08Be88b2848b2EaDA',
    },
    GuniProxyActions: {
      name: 'GuniProxyActions',
      address: '0xed3a954c0adfc8e3f85d92729c051ff320648e30',
    },
    GuniResolver: {
      name: 'GuniResolver',
      address: '0x0317650Af6f184344D7368AC8bB0bEbA5EDB214a',
    },
    GuniRouter: {
      name: 'GuniRouter',
      address: '0x14E6D67F824C3a7b4329d3228807f8654294e4bd',
    },
    CdpRegistry: {
      name: 'CdpRegistry',
      address: '0xBe0274664Ca7A68d6b5dF826FB3CcB7c620bADF3',
    },
    DefaultExchange: {
      name: 'DefaultExchange',
      address: '0xb5eB8cB6cED6b6f8E13bcD502fb489Db4a726C7B',
    },
    NoFeesExchange: {
      name: 'NoFeesExchange',
      address: '0x99e4484dac819aa74b347208752306615213d324',
    },
    LowerFeesExchange: {
      name: 'LowerFeesExchange',
      address: '0xf22f17b1d2354b4f4f52e4d164e4eb5e1f0a6ba6',
    },
    LidoCrvLiquidityFarmingReward: {
      name: 'LidoCrvLiquidityFarmingReward',
      address: '0x99ac10631f69c753ddb595d074422a0922d9056b',
    },
    ChainlinkPriceOracle_USDCUSD: {
      name: 'ChainlinkPriceOracle_USDCUSD',
      address: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
    },
    ChainlinkPriceOracle_ETHUSD: {
      name: 'ChainlinkPriceOracle_ETHUSD',
      address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    },
    SdaiOracle: {
      name: 'SdaiOracle',
      address: '0xb9E6DBFa4De19CCed908BcbFe1d015190678AB5f',
    },
    WSTETHOracle: {
      name: 'WSTETHOracle',
      address: '0x8B6851156023f4f5A66F68BEA80851c3D905Ac93',
    },
    AAVE: {
      name: 'AAVE',
      address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    },
    ADAI: {
      name: 'ADAI',
      address: '0x028171bCA77440897B824Ca71D1c56caC55b68A3',
    },
    AJNA: {
      name: 'AJNA',
      address: '0x9a96ec9b57fb64fbc60b423d1f4da7691bd35079',
    },
    APXETH: {
      name: 'APXETH',
      address: '0x9ba021b0a9b958b5e75ce9f6dff97c7ee52cb3e6',
    },
    BAL: {
      name: 'BAL',
      address: '0xba100000625a3754423978a60c9317c58a424e3D',
    },
    BAT: {
      name: 'BAT',
      address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
    },
    BWAJNA: {
      name: 'BWAJNA',
      address: '0x936Ab482d6bd111910a42849D3A51Ff80BB0A711',
    },
    CBETH: {
      name: 'CBETH',
      address: '0xbe9895146f7af43049ca1c1ae358b0541ea49704',
    },
    CBBTC: {
      name: 'CBBTC',
      address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
    },
    COMP: {
      name: 'COMP',
      address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    },
    CRVV1ETHSTETH: {
      name: 'CRVV1ETHSTETH',
      address: '0x06325440D014e39736583c165C2963BA99fAf14E',
    },
    DAI: {
      name: 'DAI',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.DAI,
    },
    ETH: {
      name: 'ETH',
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    },
    FRAX: {
      name: 'FRAX',
      address: '0x853d955acef822db058eb8505911ed77f175b99e',
    },
    GHO: {
      name: 'GHO',
      address: '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f',
    },
    GNO: {
      name: 'GNO',
      address: '0x6810e776880C02933D47DB1b9fc05908e5386b96',
    },
    GUNIV3DAIUSDC1: {
      name: 'GUNIV3DAIUSDC1',
      address: '0xAbDDAfB225e10B90D798bB8A886238Fb835e2053',
    },
    GUNIV3DAIUSDC2: {
      name: 'GUNIV3DAIUSDC2',
      address: '0x50379f632ca68D36E50cfBC8F78fe16bd1499d1e',
    },
    GUSD: {
      name: 'GUSD',
      address: '0x056Fd409E1d7A124BD7017459dFEa2F387b6d5Cd',
    },
    KNC: {
      name: 'KNC',
      address: '0xdd974D5C2e2928deA5F71b9825b8b646686BD200',
    },
    LDO: {
      name: 'LDO',
      address: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32',
    },
    LINK: {
      name: 'LINK',
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    },
    LRC: {
      name: 'LRC',
      address: '0xBBbbCA6A901c926F240b89EacB641d8Aec7AEafD',
    },
    LUSD: {
      name: 'LUSD',
      address: '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0',
    },
    MANA: {
      name: 'MANA',
      address: '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942',
    },
    MATIC: {
      name: 'MATIC',
      address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    },
    MORPHO: {
      name: 'MORPHO',
      address: '0x9994e35db50125e0df82e4c2dde62496ce330999',
    },
    OSETH: {
      name: 'OSETH',
      address: '0xf1c9acdc66974dfb6decb12aa385b9cd01190e38',
    },
    PAX: {
      name: 'PAX',
      address: '0x8E870D67F660D95d5be530380D0eC0bd388289E1',
    },
    PAXUSD: {
      name: 'PAXUSD',
      address: '0x8E870D67F660D95d5be530380D0eC0bd388289E1',
    },
    RENBTC: {
      name: 'RENBTC',
      address: '0xEB4C2781e4ebA804CE9a9803C67d0893436bB27D',
    },
    RETH: {
      name: 'RETH',
      address: '0xae78736cd615f374d3085123a210448e74fc6393',
    },
    RBN: {
      name: 'RBN',
      address: '0x6123b0049f904d730db3c36a31167d9d4121fa6b',
    },
    RWA001: {
      name: 'RWA001',
      address: '0x10b2aA5D77Aa6484886d8e244f0686aB319a270d',
    },
    RWA002: {
      name: 'RWA002',
      address: '0xAAA760c2027817169D7C8DB0DC61A2fb4c19AC23',
    },
    RWA003: {
      name: 'RWA003',
      address: '0x07F0A80aD7AeB7BfB7f139EA71B3C8f7E17156B9',
    },
    RWA004: {
      name: 'RWA004',
      address: '0x873F2101047A62F84456E3B2B13df2287925D3F9',
    },
    RWA005: {
      name: 'RWA005',
      address: '0x6DB236515E90fC831D146f5829407746EDdc5296',
    },
    RWA006: {
      name: 'RWA006',
      address: '0x4EE03cfBF6E784c462839f5954d60f7C2B60b113',
    },
    SDAI: {
      name: 'SDAI',
      address: '0x83f20f44975d03b1b09e64809b757c47f942beea',
    },
    STETH: {
      name: 'STETH',
      address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.STETH,
    },
    STYETH: {
      name: 'STYETH',
      address: '0x583019ff0f430721ada9cfb4fac8f06ca104d0b4',
    },
    TBTC: {
      name: 'TBTC',
      address: '0x18084fbA666a33d37592fA2633fD49a74DD93a88',
    },
    TUSD: {
      name: 'TUSD',
      address: '0x0000000000085d4780B73119b644AE5ecd22b376',
    },
    UNI: {
      name: 'UNI',
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    },
    UNIV2AAVEETH: {
      name: 'UNIV2AAVEETH',
      address: '0xDFC14d2Af169B0D36C4EFF567Ada9b2E0CAE044f',
    },
    UNIV2DAIETH: {
      name: 'UNIV2DAIETH',
      address: '0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11',
    },
    UNIV2DAIUSDC: {
      name: 'UNIV2DAIUSDC',
      address: '0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5',
    },
    UNIV2DAIUSDT: {
      name: 'UNIV2DAIUSDT',
      address: '0xB20bd5D04BE54f870D5C0d3cA85d82b34B836405',
    },
    UNIV2ETHUSDT: {
      name: 'UNIV2ETHUSDT',
      address: '0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852',
    },
    UNIV2LINKETH: {
      name: 'UNIV2LINKETH',
      address: '0xa2107FA5B38d9bbd2C461D6EDf11B11A50F6b974',
    },
    UNIV2UNIETH: {
      name: 'UNIV2UNIETH',
      address: '0xd3d2E2692501A5c9Ca623199D38826e513033a17',
    },
    UNIV2USDCETH: {
      name: 'UNIV2USDCETH',
      address: '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc',
    },
    UNIV2WBTCDAI: {
      name: 'UNIV2WBTCDAI',
      address: '0x231B7589426Ffe1b75405526fC32aC09D44364c4',
    },
    UNIV2WBTCETH: {
      name: 'UNIV2WBTCETH',
      address: '0xBb2b8038a1640196FbE3e38816F3e67Cba72D940',
    },
    USDC: {
      name: 'USDC',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.USDC,
    },
    'USDC.E': {
      name: 'USDC.E',
      address: '0x0000000000000000000000000000000000000000',
    },
    USDBC: {
      name: 'USDBC',
      address: '0x0000000000000000000000000000000000000000',
    },
    USDT: {
      name: 'USDT',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    },
    WBTC: {
      name: 'WBTC',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WBTC,
    },
    WETH: {
      name: 'WETH',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WETH,
    },
    WLD: {
      name: 'WLD',
      address: '0x163f8c2467924be0ae7b5347228cabf260318753',
    },
    WSTETH: {
      name: 'WSTETH',
      address: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.common.WSTETH,
    },
    WEETH: {
      name: 'WEETH',
      address: '0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee',
    },
    YIELDBTC: {
      name: 'YIELDBTC',
      address: '0x0274a704a6d9129f90a62ddc6f6024b33ecdad36',
    },
    YIELDETH: {
      name: 'YIELDETH',
      address: '0xb5b29320d2dde5ba5bafa1ebcd270052070483ec',
    },
    YFI: {
      name: 'YFI',
      address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
    },
    ZRX: {
      name: 'ZRX',
      address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
    },
  },
  aave: {
    v2: {
      Oracle: {
        name: 'Oracle',
        address: '0xa50ba011c48153de246e5192c8f9258a2ba79ca9',
      },
      LendingPool: {
        name: 'LendingPool',
        address: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.LENDING_POOL,
      },
      PoolDataProvider: {
        name: 'PoolDataProvider',
        address: '0x057835Ad21a177dbdd3090bB1CAE03EaCF78Fc6d',
      },
      WETHGateway: {
        name: 'WETHGateway',
        address: '0xcc9a0B7c43DC2a5F023Bb9b738E45B0Ef6B06E04',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v2.WETH_GATEWAY,
      },
    },
    v3: {
      Oracle: {
        name: 'Oracle',
        address: '0x54586bE62E3c3580375aE3723C145253060Ca0C2',
      },
      LendingPool: {
        name: 'LendingPool',
        address: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
        serviceRegistryName: SERVICE_REGISTRY_NAMES.aave.v3.AAVE_POOL,
      },
      PoolDataProvider: {
        name: 'PoolDataProvider',
        address: '0x41393e5e337606dc3821075Af65AeE84D7688CBD',
      },
      L2Encoder: {
        name: 'L2Encoder',
        address: '0x0000000000000000000000000000000000000000',
      },
      RewardsController: {
        name: 'RewardsController',
        address: '0x8164Cc65827dcFe994AB23944CBC90e0aa80bFcb',
      },
    },
  },
  spark: {
    Oracle: {
      name: 'Oracle',
      address: '0x8105f69D9C41644c6A0803fDA7D03Aa70996cFD9',
    },
    LendingPool: {
      name: 'LendingPool',
      address: '0xC13e21B648A5Ee794902342038FF3aDAB66BE987',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.spark.LENDING_POOL,
    },
    PoolDataProvider: {
      name: 'PoolDataProvider',
      address: '0xFc21d6d146E6086B8359705C8b28512a983db0cb',
    },
    RewardsController: {
      name: 'RewardsController',
      address: '0x4370D3b6C9588E02ce9D22e684387859c7Ff5b34',
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
        address: '0x60744434d6339a6B27d73d9Eda62b6F66a0a04FA',
      },
      CdpManager: {
        name: 'CdpManager',
        address: '0x5ef30b9986345249bc32d8928B7ee64DE9435E39',
      },
      GetCdps: {
        name: 'GetCdps',
        address: '0x36a724Bd100c39f0Ea4D3A20F7097eE01A8Ff573',
      },
      Jug: {
        name: 'Jug',
        address: '0x19c0976f590D67707E62397C87829d896Dc0f1F1',
      },
      Pot: {
        name: 'Pot',
        address: '0x197E90f9FAD81970bA7976f33CbD77088E5D7cf7',
      },
      End: {
        name: 'End',
        address: '0xBB856d1742fD182a90239D7AE85706C2FE4e5922',
      },
      Spot: {
        name: 'Spot',
        address: '0x65C79fcB50Ca1594B025960e539eD7A9a6D434A3',
      },
      Dog: {
        name: 'Dog',
        address: '0x135954d155898D42C90D2a57824C690e0c7BEf1B',
      },
      Vat: {
        name: 'Vat',
        address: '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B',
      },
      McdGov: {
        name: 'McdGov',
        address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      },
    },
    joins: {
      MCD_JOIN_DAI: {
        name: 'MCD_JOIN_DAI',
        address: '0x9759A6Ac90977b93B58547b4A71c78317f391A28',
      },
      MCD_JOIN_ETH_A: {
        name: 'MCD_JOIN_ETH_A',
        address: '0x2F0b23f53734252Bda2277357e97e1517d6B042A',
      },
      MCD_JOIN_ETH_B: {
        name: 'MCD_JOIN_ETH_B',
        address: '0x08638eF1A205bE6762A8b935F5da9b700Cf7322c',
      },
      MCD_JOIN_ETH_C: {
        name: 'MCD_JOIN_ETH_C',
        address: '0xF04a5cC80B1E94C69B48f5ee68a08CD2F09A7c3E',
      },
      MCD_JOIN_BAT_A: {
        name: 'MCD_JOIN_BAT_A',
        address: '0x3D0B1912B66114d4096F48A8CEe3A56C231772cA',
      },
      MCD_JOIN_USDC_A: {
        name: 'MCD_JOIN_USDC_A',
        address: '0xA191e578a6736167326d05c119CE0c90849E84B7',
      },
      MCD_JOIN_USDC_B: {
        name: 'MCD_JOIN_USDC_B',
        address: '0x2600004fd1585f7270756DDc88aD9cfA10dD0428',
      },
      MCD_JOIN_PSM_USDC_A: {
        name: 'MCD_JOIN_PSM_USDC_A',
        address: '0x0A59649758aa4d66E25f08Dd01271e891fe52199',
      },
      MCD_JOIN_WBTC_A: {
        name: 'MCD_JOIN_WBTC_A',
        address: '0xBF72Da2Bd84c5170618Fbe5914B0ECA9638d5eb5',
      },
      MCD_JOIN_WBTC_B: {
        name: 'MCD_JOIN_WBTC_B',
        address: '0xfA8c996e158B80D77FbD0082BB437556A65B96E0',
      },
      MCD_JOIN_WBTC_C: {
        name: 'MCD_JOIN_WBTC_C',
        address: '0x7f62f9592b823331E012D3c5DdF2A7714CfB9de2',
      },
      MCD_JOIN_TUSD_A: {
        name: 'MCD_JOIN_TUSD_A',
        address: '0x4454aF7C8bb9463203b66C816220D41ED7837f44',
      },
      MCD_JOIN_ZRX_A: {
        name: 'MCD_JOIN_ZRX_A',
        address: '0xc7e8Cd72BDEe38865b4F5615956eF47ce1a7e5D0',
      },
      MCD_JOIN_KNC_A: {
        name: 'MCD_JOIN_KNC_A',
        address: '0x475F1a89C1ED844A08E8f6C50A00228b5E59E4A9',
      },
      MCD_JOIN_MANA_A: {
        name: 'MCD_JOIN_MANA_A',
        address: '0xA6EA3b9C04b8a38Ff5e224E7c3D6937ca44C0ef9',
      },
      MCD_JOIN_USDT_A: {
        name: 'MCD_JOIN_USDT_A',
        address: '0x0Ac6A1D74E84C2dF9063bDDc31699FF2a2BB22A2',
      },
      MCD_JOIN_PAXUSD_A: {
        name: 'MCD_JOIN_PAXUSD_A',
        address: '0x7e62B7E279DFC78DEB656E34D6a435cC08a44666',
      },
      MCD_JOIN_PSM_PAX_A: {
        name: 'MCD_JOIN_PSM_PAX_A',
        address: '0x7bbd8cA5e413bCa521C2c80D8d1908616894Cf21',
      },
      MCD_JOIN_COMP_A: {
        name: 'MCD_JOIN_COMP_A',
        address: '0xBEa7cDfB4b49EC154Ae1c0D731E4DC773A3265aA',
      },
      MCD_JOIN_LRC_A: {
        name: 'MCD_JOIN_LRC_A',
        address: '0x6C186404A7A238D3d6027C0299D1822c1cf5d8f1',
      },
      MCD_JOIN_LINK_A: {
        name: 'MCD_JOIN_LINK_A',
        address: '0xdFccAf8fDbD2F4805C174f856a317765B49E4a50',
      },
      MCD_JOIN_BAL_A: {
        name: 'MCD_JOIN_BAL_A',
        address: '0x4a03Aa7fb3973d8f0221B466EefB53D0aC195f55',
      },
      MCD_JOIN_YFI_A: {
        name: 'MCD_JOIN_YFI_A',
        address: '0x3ff33d9162aD47660083D7DC4bC02Fb231c81677',
      },
      MCD_JOIN_GUSD_A: {
        name: 'MCD_JOIN_GUSD_A',
        address: '0xe29A14bcDeA40d83675aa43B72dF07f649738C8b',
      },
      MCD_JOIN_PSM_GUSD_A: {
        name: 'MCD_JOIN_PSM_GUSD_A',
        address: '0x79A0FA989fb7ADf1F8e80C93ee605Ebb94F7c6A5',
      },
      MCD_JOIN_UNI_A: {
        name: 'MCD_JOIN_UNI_A',
        address: '0x3BC3A58b4FC1CbE7e98bB4aB7c99535e8bA9b8F1',
      },
      MCD_JOIN_RENBTC_A: {
        name: 'MCD_JOIN_RENBTC_A',
        address: '0xFD5608515A47C37afbA68960c1916b79af9491D0',
      },
      MCD_JOIN_AAVE_A: {
        name: 'MCD_JOIN_AAVE_A',
        address: '0x24e459F61cEAa7b1cE70Dbaea938940A7c5aD46e',
      },
      MCD_JOIN_MATIC_A: {
        name: 'MCD_JOIN_MATIC_A',
        address: '0x885f16e177d45fC9e7C87e1DA9fd47A9cfcE8E13',
      },
      MCD_JOIN_WSTETH_A: {
        name: 'MCD_JOIN_WSTETH_A',
        address: '0x10CD5fbe1b404B7E19Ef964B63939907bdaf42E2',
      },
      MCD_JOIN_WSTETH_B: {
        name: 'MCD_JOIN_WSTETH_B',
        address: '0x248cCBf4864221fC0E840F29BB042ad5bFC89B5c',
      },
      MCD_JOIN_DIRECT_AAVEV2_DAI: {
        name: 'MCD_JOIN_DIRECT_AAVEV2_DAI',
        address: '0xa13C0c8eB109F5A13c6c90FC26AFb23bEB3Fb04a',
      },
      MCD_JOIN_UNIV2DAIETH_A: {
        name: 'MCD_JOIN_UNIV2DAIETH_A',
        address: '0x2502F65D77cA13f183850b5f9272270454094A08',
      },
      MCD_JOIN_UNIV2WBTCETH_A: {
        name: 'MCD_JOIN_UNIV2WBTCETH_A',
        address: '0xDc26C9b7a8fe4F5dF648E314eC3E6Dc3694e6Dd2',
      },
      MCD_JOIN_UNIV2USDCETH_A: {
        name: 'MCD_JOIN_UNIV2USDCETH_A',
        address: '0x03Ae53B33FeeAc1222C3f372f32D37Ba95f0F099',
      },
      MCD_JOIN_UNIV2DAIUSDC_A: {
        name: 'MCD_JOIN_UNIV2DAIUSDC_A',
        address: '0xA81598667AC561986b70ae11bBE2dd5348ed4327',
      },
      MCD_JOIN_UNIV2ETHUSDT_A: {
        name: 'MCD_JOIN_UNIV2ETHUSDT_A',
        address: '0x4aAD139a88D2dd5e7410b408593208523a3a891d',
      },
      MCD_JOIN_UNIV2LINKETH_A: {
        name: 'MCD_JOIN_UNIV2LINKETH_A',
        address: '0xDae88bDe1FB38cF39B6A02b595930A3449e593A6',
      },
      MCD_JOIN_UNIV2UNIETH_A: {
        name: 'MCD_JOIN_UNIV2UNIETH_A',
        address: '0xf11a98339FE1CdE648e8D1463310CE3ccC3d7cC1',
      },
      MCD_JOIN_UNIV2WBTCDAI_A: {
        name: 'MCD_JOIN_UNIV2WBTCDAI_A',
        address: '0xD40798267795Cbf3aeEA8E9F8DCbdBA9b5281fcC',
      },
      MCD_JOIN_UNIV2AAVEETH_A: {
        name: 'MCD_JOIN_UNIV2AAVEETH_A',
        address: '0x42AFd448Df7d96291551f1eFE1A590101afB1DfF',
      },
      MCD_JOIN_UNIV2DAIUSDT_A: {
        name: 'MCD_JOIN_UNIV2DAIUSDT_A',
        address: '0xAf034D882169328CAf43b823a4083dABC7EEE0F4',
      },
      MCD_JOIN_GUNIV3DAIUSDC1_A: {
        name: 'MCD_JOIN_GUNIV3DAIUSDC1_A',
        address: '0xbFD445A97e7459b0eBb34cfbd3245750Dba4d7a4',
      },
      MCD_JOIN_GUNIV3DAIUSDC2_A: {
        name: 'MCD_JOIN_GUNIV3DAIUSDC2_A',
        address: '0xA7e4dDde3cBcEf122851A7C8F7A55f23c0Daf335',
      },
      MCD_JOIN_CRVV1ETHSTETH_A: {
        name: 'MCD_JOIN_CRVV1ETHSTETH_A',
        address: '0x82D8bfDB61404C796385f251654F6d7e92092b5D',
      },
      MCD_JOIN_RWA001_A: {
        name: 'MCD_JOIN_RWA001_A',
        address: '0x476b81c12Dc71EDfad1F64B9E07CaA60F4b156E2',
      },
      MCD_JOIN_RWA002_A: {
        name: 'MCD_JOIN_RWA002_A',
        address: '0xe72C7e90bc26c11d45dBeE736F0acf57fC5B7152',
      },
      MCD_JOIN_RWA003_A: {
        name: 'MCD_JOIN_RWA003_A',
        address: '0x1Fe789BBac5b141bdD795A3Bc5E12Af29dDB4b86',
      },
      MCD_JOIN_RWA004_A: {
        name: 'MCD_JOIN_RWA004_A',
        address: '0xD50a8e9369140539D1c2D113c4dC1e659c6242eB',
      },
      MCD_JOIN_RWA005_A: {
        name: 'MCD_JOIN_RWA005_A',
        address: '0xA4fD373b93aD8e054970A3d6cd4Fd4C31D08192e',
      },
      MCD_JOIN_RWA006_A: {
        name: 'MCD_JOIN_RWA006_A',
        address: '0x5E11E34b6745FeBa9449Ae53c185413d6EdC66BE',
      },
      MCD_JOIN_RETH_A: {
        name: 'MCD_JOIN_RETH_A',
        address: '0xc6424e862f1462281b0a5fac078e4b63006bdebf',
      },
      MCD_JOIN_GNO_A: {
        name: 'MCD_JOIN_GNO_A',
        address: '0x7bD3f01e24E0f0838788bC8f573CEA43A80CaBB5',
      },
    },
    pips: {
      PIP_ETH: {
        name: 'PIP_ETH',
        address: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',
      },
      PIP_BAT: {
        name: 'PIP_BAT',
        address: '0xB4eb54AF9Cc7882DF0121d26c5b97E802915ABe6',
      },
      PIP_USDC: {
        name: 'PIP_USDC',
        address: '0x77b68899b99b686F415d074278a9a16b336085A0',
      },
      PIP_WBTC: {
        name: 'PIP_WBTC',
        address: '0xf185d0682d50819263941e5f4EacC763CC5C6C42',
      },
      PIP_TUSD: {
        name: 'PIP_TUSD',
        address: '0xeE13831ca96d191B688A670D47173694ba98f1e5',
      },
      PIP_ZRX: {
        name: 'PIP_ZRX',
        address: '0x7382c066801E7Acb2299aC8562847B9883f5CD3c',
      },
      PIP_KNC: {
        name: 'PIP_KNC',
        address: '0xf36B79BD4C0904A5F350F1e4f776B81208c13069',
      },
      PIP_MANA: {
        name: 'PIP_MANA',
        address: '0x8067259EA630601f319FccE477977E55C6078C13',
      },
      PIP_USDT: {
        name: 'PIP_USDT',
        address: '0x7a5918670B0C390aD25f7beE908c1ACc2d314A3C',
      },
      PIP_PAXUSD: {
        name: 'PIP_PAXUSD',
        address: '0x043B963E1B2214eC90046167Ea29C2c8bDD7c0eC',
      },
      PIP_PAX: {
        name: 'PIP_PAX',
        address: '0x043B963E1B2214eC90046167Ea29C2c8bDD7c0eC',
      },
      PIP_COMP: {
        name: 'PIP_COMP',
        address: '0xBED0879953E633135a48a157718Aa791AC0108E4',
      },
      PIP_LRC: {
        name: 'PIP_LRC',
        address: '0x9eb923339c24c40Bef2f4AF4961742AA7C23EF3a',
      },
      PIP_LINK: {
        name: 'PIP_LINK',
        address: '0x9B0C694C6939b5EA9584e9b61C7815E8d97D9cC7',
      },
      PIP_BAL: {
        name: 'PIP_BAL',
        address: '0x3ff860c0F28D69F392543A16A397D0dAe85D16dE',
      },
      PIP_YFI: {
        name: 'PIP_YFI',
        address: '0x5F122465bCf86F45922036970Be6DD7F58820214',
      },
      PIP_GUSD: {
        name: 'PIP_GUSD',
        address: '0xf45Ae69CcA1b9B043dAE2C83A5B65Bc605BEc5F5',
      },
      PIP_UNI: {
        name: 'PIP_UNI',
        address: '0xf363c7e351C96b910b92b45d34190650df4aE8e7',
      },
      PIP_RENBTC: {
        name: 'PIP_RENBTC',
        address: '0xf185d0682d50819263941e5f4EacC763CC5C6C42',
      },
      PIP_AAVE: {
        name: 'PIP_AAVE',
        address: '0x8Df8f06DC2dE0434db40dcBb32a82A104218754c',
      },
      PIP_MATIC: {
        name: 'PIP_MATIC',
        address: '0x8874964279302e6d4e523Fb1789981C39a1034Ba',
      },
      PIP_WSTETH: {
        name: 'PIP_WSTETH',
        address: '0xFe7a2aC0B945f12089aEEB6eCebf4F384D9f043F',
      },
      PIP_ADAI: {
        name: 'PIP_ADAI',
        address: '0x6A858592fC4cBdf432Fc9A1Bc8A0422B99330bdF',
      },
      PIP_UNIV2DAIETH: {
        name: 'PIP_UNIV2DAIETH',
        address: '0xFc8137E1a45BAF0030563EC4F0F851bd36a85b7D',
      },
      PIP_UNIV2WBTCETH: {
        name: 'PIP_UNIV2WBTCETH',
        address: '0x8400D2EDb8B97f780356Ef602b1BdBc082c2aD07',
      },
      PIP_UNIV2USDCETH: {
        name: 'PIP_UNIV2USDCETH',
        address: '0xf751f24DD9cfAd885984D1bA68860F558D21E52A',
      },
      PIP_UNIV2DAIUSDC: {
        name: 'PIP_UNIV2DAIUSDC',
        address: '0x25D03C2C928ADE19ff9f4FFECc07d991d0df054B',
      },
      PIP_UNIV2ETHUSDT: {
        name: 'PIP_UNIV2ETHUSDT',
        address: '0x5f6dD5B421B8d92c59dC6D907C9271b1DBFE3016',
      },
      PIP_UNIV2LINKETH: {
        name: 'PIP_UNIV2LINKETH',
        address: '0xd7d31e62AE5bfC3bfaa24Eda33e8c32D31a1746F',
      },
      PIP_UNIV2UNIETH: {
        name: 'PIP_UNIV2UNIETH',
        address: '0x8462A88f50122782Cc96108F476deDB12248f931',
      },
      PIP_UNIV2WBTCDAI: {
        name: 'PIP_UNIV2WBTCDAI',
        address: '0x5bB72127a196392cf4aC00Cf57aB278394d24e55',
      },
      PIP_UNIV2AAVEETH: {
        name: 'PIP_UNIV2AAVEETH',
        address: '0x32d8416e8538Ac36272c44b0cd962cD7E0198489',
      },
      PIP_UNIV2DAIUSDT: {
        name: 'PIP_UNIV2DAIUSDT',
        address: '0x9A1CD705dc7ac64B50777BcEcA3529E58B1292F1',
      },
      PIP_GUNIV3DAIUSDC1: {
        name: 'PIP_GUNIV3DAIUSDC1',
        address: '0x7F6d78CC0040c87943a0e0c140De3F77a273bd58',
      },
      PIP_GUNIV3DAIUSDC2: {
        name: 'PIP_GUNIV3DAIUSDC2',
        address: '0xcCBa43231aC6eceBd1278B90c3a44711a00F4e93',
      },
      PIP_CRVV1ETHSTETH: {
        name: 'PIP_CRVV1ETHSTETH',
        address: '0xEa508F82728927454bd3ce853171b0e2705880D4',
      },
      PIP_RWA001: {
        name: 'PIP_RWA001',
        address: '0x76A9f30B45F4ebFD60Ce8a1c6e963b1605f7cB6d',
      },
      PIP_RWA002: {
        name: 'PIP_RWA002',
        address: '0xd2473237E20Bd52F8E7cE0FD79403A6a82fbAEC8',
      },
      PIP_RWA003: {
        name: 'PIP_RWA003',
        address: '0xDeF7E88447F7D129420FC881B2a854ABB52B73B8',
      },
      PIP_RWA004: {
        name: 'PIP_RWA004',
        address: '0x5eEE1F3d14850332A75324514CcbD2DBC8Bbc566',
      },
      PIP_RWA005: {
        name: 'PIP_RWA005',
        address: '0x8E6039C558738eb136833aB50271ae065c700d2B',
      },
      PIP_RWA006: {
        name: 'PIP_RWA006',
        address: '0xB8AeCF04Fdf22Ef6C0c6b6536896e1F2870C41D3',
      },
      PIP_RETH: {
        name: 'PIP_RETH',
        address: '0xee7f0b350aa119b3d05dc733a4621a81972f7d47',
      },
      PIP_GNO: {
        name: 'PIP_GNO',
        address: '0xd800ca44fFABecd159c7889c3bf64a217361AEc8',
      },
      PIP_WETH: {
        name: 'PIP_WETH',
        address: '0x81FE72B5A8d1A857d176C3E7d5Bd2679A9B85763',
      },
    },
  },
  automation: {
    AutomationBot: {
      name: 'AutomationBot',
      address: '0x6E87a7A0A03E51A741075fDf4D1FCce39a4Df01b',
    },
    AutomationBotV2: {
      name: 'AutomationBotV2',
      address: '0x5743b5606e94fb534a31e1cefb3242c8a9422e5e',
    },
    AutomationBotAggregator: {
      name: 'AutomationBotAggregator',
      address: '0x5f1d184204775fBB351C4b2C61a2fD4aAbd3fB76',
    },
  },
  ajna: {
    AjnaPoolPairs_AJNADAI: {
      name: 'AjnaPoolPairs_AJNADAI',
      address: '0x2feef99a711d684e00a017c4ac587bea31f12875',
    },
    AjnaPoolPairs_APXETHETH: {
      name: 'AjnaPoolPairs_APXETHETH',
      address: '0x1eea11c09eb446261739bbd1315992c3632960df',
    },
    AjnaPoolPairs_CBETHETH: {
      name: 'AjnaPoolPairs_CBETHETH',
      address: '0x0000000000000000000000000000000000000000',
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
      address: '0xE4BfB9b344A0Ae89702184281F13A295F3D49e15',
    },
    AjnaPoolPairs_GHODAI: {
      name: 'AjnaPoolPairs_GHODAI',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_MKRDAI: {
      name: 'AjnaPoolPairs_MKRDAI',
      address: '0x0598c1feda47535ff5248e2bd08703ace4e740c4',
    },
    AjnaPoolPairs_MWSTETHWPUNKS20WSTETH: {
      name: 'AjnaPoolPairs_MWSTETHWPUNKS20WSTETH',
      address: '0x1b3ca2a7b12859fe34cefd7072d770fb6a1e7679',
    },
    AjnaPoolPairs_MWSTETHWPUNKS40WSTETH: {
      name: 'AjnaPoolPairs_MWSTETHWPUNKS40WSTETH',
      address: '0x7a2f9d2610ab99952dfb44f8aa3707584baacb8d',
    },
    AjnaPoolPairs_RETHDAI: {
      name: 'AjnaPoolPairs_RETHDAI',
      address: '0x9cdB48FcBd8241Bb75887AF04d3b1302c410F671',
    },
    AjnaPoolPairs_RETHETH: {
      name: 'AjnaPoolPairs_RETHETH',
      address: '0xE300B3A6b24cB3c5c87034155F7ffF7F77C862a0',
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
      address: '0xc2a03288c046c7447faa598a515e494cbc7187c3',
    },
    AjnaPoolPairs_SDAIUSDC: {
      name: 'AjnaPoolPairs_SDAIUSDC',
      address: '0x90Ac6604aE71B5D978f3fC6074078987249119Ea',
    },
    AjnaPoolPairs_STYETHDAI: {
      name: 'AjnaPoolPairs_STYETHDAI',
      address: '0x304375e4890146dc575b894b35a42608fab823a8',
    },
    AjnaPoolPairs_SUSDEDAI: {
      name: 'AjnaPoolPairs_SUSDEDAI',
      address: '0x34bc3d3d274a355f3404c5dee2a96335540234de',
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
      address: '0x2Ceb74Bb7a92D652C850C16F48547aa49F8bca31',
    },
    AjnaPoolPairs_USDCWLD: {
      name: 'AjnaPoolPairs_USDCWLD',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_USDCWBTC: {
      name: 'AjnaPoolPairs_USDCWBTC',
      address: '0xE92Cd0ACF334D1133551bC4c87eA73BbC49Ce711',
    },
    AjnaPoolPairs_WBTCDAI: {
      name: 'AjnaPoolPairs_WBTCDAI',
      address: '0x50f1C63f3AEfD60C665eF45aA74f274dABf93405',
    },
    AjnaPoolPairs_WBTCGHO: {
      name: 'AjnaPoolPairs_WBTCGHO',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_WBTCUSDC: {
      name: 'AjnaPoolPairs_WBTCUSDC',
      address: '0x3BB7C1E268A51b2D933C0490e282e20b906f8652',
    },
    AjnaPoolPairs_WLDUSDC: {
      name: 'AjnaPoolPairs_WLDUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_WSTETHDAI: {
      name: 'AjnaPoolPairs_WSTETHDAI',
      address: '0xcD261cd365389A58e6467bb8a83A9E437864e8E5',
    },
    AjnaPoolPairs_WSTETHETH: {
      name: 'AjnaPoolPairs_WSTETHETH',
      address: '0x3BA6A019eD5541b5F5555d8593080042Cf3ae5f4',
    },
    AjnaPoolPairs_WSTETHGHO: {
      name: 'AjnaPoolPairs_WSTETHGHO',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_WSTETHUSDC: {
      name: 'AjnaPoolPairs_WSTETHUSDC',
      address: '0xF5B1AD7F82549c2BBf08AAa79c9eFC70C6E46b06',
    },
    AjnaPoolPairs_YFIDAI: {
      name: 'AjnaPoolPairs_YFIDAI',
      address: '0x66ea46C6e7F9e5BB065bd3B1090FFF229393BA51',
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
      address: '0x64aa997236996823a53b8b30ead599aa2f0382fa',
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
      address: '0x6a511d452423537da52bc18b61305966473b8711',
    },
    AjnaPoolPairs_XETHWETH: {
      name: 'AjnaPoolPairs_XETHWETH',
      address: '0x6c9d12a97abc79410e49a3d50f233ad428a81f8c',
    },
    AjnaPoolPairs_CSETHWETH: {
      name: 'AjnaPoolPairs_CSETHWETH',
      address: '0xe3fbb8ca68401e08556746e5656937f4f2a89e7d',
    },
    AjnaPoolPairs_APXETHWETH: {
      name: 'AjnaPoolPairs_APXETHWETH',
      address: '0x1eea11c09eb446261739bbd1315992c3632960df',
    },
    AjnaPoolPairs_DETHWETH: {
      name: 'AjnaPoolPairs_DETHWETH',
      address: '0xcff6231d6dcd52d98f1ec1afec7063962fc3092f',
    },
    AjnaPoolPairs_UNIETHWETH: {
      name: 'AjnaPoolPairs_UNIETHWETH',
      address: '0x320ea0fe27b06f94bd464997530a4a9ec49d2472',
    },
    AjnaPoolPairs_MPETHWETH: {
      name: 'AjnaPoolPairs_MPETHWETH',
      address: '0x580d779cd5c5667357647104e1898b17f1550c52',
    },
    AjnaPoolPairs_EZETHWETH: {
      name: 'AjnaPoolPairs_EZETHWETH',
      address: '0x95af0f183cee1d797c921f53090c73f310610e73',
    },
    AjnaPoolPairs_DEGENUSDC: {
      name: 'AjnaPoolPairs_DEGENUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_DEGENCUSDCV3: {
      name: 'AjnaPoolPairs_DEGENCUSDCV3',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_USDCDEGEN: {
      name: 'AjnaPoolPairs_USDCDEGEN',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_SNXUSDC: {
      name: 'AjnaPoolPairs_SNXUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_SNXCUSDCV3: {
      name: 'AjnaPoolPairs_SNXCUSDCV3',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_ENASDAI: {
      name: 'AjnaPoolPairs_ENASDAI',
      address: '0x4176747Bc01BE99f9e8FE78A7b2303d4662a2244',
    },
    AjnaPoolPairs_SDAIENA: {
      name: 'AjnaPoolPairs_SDAIENA',
      address: '0x52054b0f7f07bb8e6daa06d177ece312ccc1f685',
    },
    AjnaPoolPairs_AEROUSDC: {
      name: 'AjnaPoolPairs_AEROUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_PRIMEUSDC: {
      name: 'AjnaPoolPairs_PRIMEUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_SAFEDAI: {
      name: 'AjnaPoolPairs_SAFEDAI',
      address: '0x37b5921f0da465df64637a418110a2e3aa90b209',
    },
    'AjnaPoolPairs_UNI-V2DAI': {
      name: 'AjnaPoolPairs_UNI-V2DAI',
      address: '0xc71ad394818474f87f27a5525243de52c278dcb8',
    },
    'AjnaPoolPairs_MOOAURAGYROAUSDCN/AUSDTNUSDC': {
      name: 'AjnaPoolPairs_MOOAURAGYROAUSDCN/AUSDTNUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_SUSDCYUSDC: {
      name: 'AjnaPoolPairs_SUSDCYUSDC',
      address: '0x0000000000000000000000000000000000000000',
    },
    AjnaPoolPairs_WOETHETH: {
      name: 'AjnaPoolPairs_WOETHETH',
      address: '0xDD433012C0d99AEbE83FFf55B4D405831DE85fbc',
    },
    AjnaPoolPairs_SYRUPUSDCUSDC: {
      name: 'AjnaPoolPairs_SYRUPUSDCUSDC',
      address: '0xbcda8ee352778071fc7f09b8bfbcd832aa09cee9',
    },
    AjnaPoolInfo: {
      name: 'AjnaPoolInfo',
      address: '0x30c5eF2997d6a882DE52c4ec01B6D0a5e5B4fAAE',
      serviceRegistryName: SERVICE_REGISTRY_NAMES.ajna.AJNA_POOL_UTILS_INFO,
    },
    AjnaProxyActions: {
      name: 'AjnaProxyActions',
      address: '0x3637DF43F938b05A71bb828f13D9f14498E6883c',
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
      address: '0xf309EE5603bF05E5614dB930E4EAB661662aCeE6',
    },
    AjnaBonusRewardsReedemer: {
      name: 'AjnaBonusRewardsReedemer',
      address: '0xEB233d4D1D756469A2C7f0b42034D0507d744542',
    },
    ERC20PoolFactory: {
      name: 'ERC20PoolFactory',
      address: '0x6146DD43C5622bB6D12A5240ab9CF4de14eDC625',
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
      address: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
    },
  },
}
