import { CONTRACT_NAMES } from '@dma-deployments/constants/contract-names'
import { SystemConfig } from '@dma-deployments/types/deployment-config'

export const config: SystemConfig = {
  mpa: {
    core: {
      ServiceRegistry: {
        name: 'ServiceRegistry',
        deploy: true,
        address: '0xf22F17B1D2354B4F4F52e4d164e4eB5e1f0A6Ba6',
        history: [],
        constructorArgs: [0],
      },
      OperationExecutor: {
        name: 'OperationExecutor',
        deploy: true,
        address: '0x5AB3e51608cEa26090445CA89bc91628C8bB99f9',
        serviceRegistryName: CONTRACT_NAMES.common.OPERATION_EXECUTOR,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      OperationStorage: {
        name: 'OperationStorage',
        deploy: true,
        address: '0xd4FEaf1023CD6998053a1eb02460000980Cc908f',
        serviceRegistryName: CONTRACT_NAMES.common.OPERATION_STORAGE,
        history: [],
        constructorArgs: ['address:ServiceRegistry', 'address:OperationExecutor'],
      },
      OperationsRegistry: {
        name: 'OperationsRegistry',
        deploy: true,
        address: '0x392ACeBea829373A3eFDc0dA80a16003106d8f6E',
        serviceRegistryName: CONTRACT_NAMES.common.OPERATIONS_REGISTRY,
        history: [],
        constructorArgs: [],
      },
      DSProxyFactory: {
        name: 'DSProxyFactory',
        deploy: true,
        address: '',
        serviceRegistryName: CONTRACT_NAMES.common.DS_PROXY_FACTORY,
        history: [],
        constructorArgs: [],
      },
      DSProxyRegistry: {
        name: 'DSProxyRegistry',
        deploy: true,
        address: '',
        serviceRegistryName: CONTRACT_NAMES.common.DS_PROXY_REGISTRY,
        history: [],
        constructorArgs: ['address:DSProxyFactory'],
      },
      DSGuardFactory: {
        name: 'DSGuardFactory',
        deploy: true,
        address: '',
        serviceRegistryName: CONTRACT_NAMES.common.DS_GUARD_FACTORY,
        history: [],
        constructorArgs: [],
      },
      AccountGuard: {
        name: 'AccountGuard',
        deploy: true,
        address: '0x63059cC2533344B65372983D4B6258b2cbbBF0Da',
        serviceRegistryName: CONTRACT_NAMES.common.ACCOUNT_GUARD,
        history: [],
        constructorArgs: [],
      },
      AccountFactory: {
        name: 'AccountFactory',
        deploy: true,
        address: '0xE166a06809FD35Cece10df9Cace87BbDB9a48F66',
        serviceRegistryName: CONTRACT_NAMES.common.ACCOUNT_FACTORY,
        history: [],
        constructorArgs: ['address:AccountGuard'],
      },
      Swap: {
        name: 'Swap',
        deploy: true,
        address: '',
        serviceRegistryName: CONTRACT_NAMES.common.SWAP,
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
        address: '0xE7aA0939F0cFF45162A22751CbE0009c689EA256',
        serviceRegistryName: CONTRACT_NAMES.common.POSITION_CREATED,
        history: [],
        constructorArgs: [],
      },
      SwapAction: {
        name: 'SwapAction',
        deploy: true,
        address: '0x55D4d311Cd9B2dD5693FB51f06DbE50B9Da84D13',
        serviceRegistryName: CONTRACT_NAMES.common.SWAP_ACTION,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      TakeFlashloan: {
        name: 'TakeFlashloan',
        deploy: true,
        address: '0x53958191c3077eDe3Ca90Eb840283df063FC1be3',
        serviceRegistryName: CONTRACT_NAMES.common.TAKE_A_FLASHLOAN,
        history: [],
        constructorArgs: [
          'address:ServiceRegistry',
          '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
          'address:DSGuardFactory',
        ],
      },
      SetApproval: {
        name: 'SetApproval',
        deploy: true,
        address: '0x983EFCA0Fd5F9B03f75BbBD41F4BeD3eC20c96d8',
        serviceRegistryName: CONTRACT_NAMES.common.SET_APPROVAL,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      PullToken: {
        name: 'PullToken',
        deploy: true,
        address: '0xFAf9D0B7B92e8B281CaF10b42970179B45CA6412',
        serviceRegistryName: CONTRACT_NAMES.common.PULL_TOKEN,
        history: [],
        constructorArgs: [],
      },
      SendToken: {
        name: 'SendToken',
        deploy: true,
        address: '0xeB54C366512c4d59A222A251ea7316568859E08C',
        serviceRegistryName: CONTRACT_NAMES.common.SEND_TOKEN,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      WrapEth: {
        name: 'WrapEth',
        deploy: true,
        address: '0x43C9a445fCf3bc3d1483c0b90DC0346249c0D84C',
        serviceRegistryName: CONTRACT_NAMES.common.WRAP_ETH,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      UnwrapEth: {
        name: 'UnwrapEth',
        deploy: true,
        address: '0x7E7EB65A93441a2D2Bf0941216b4c1116B554d85',
        serviceRegistryName: CONTRACT_NAMES.common.UNWRAP_ETH,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      ReturnFunds: {
        name: 'ReturnFunds',
        deploy: true,
        address: '0xAC0B1652388Ea425884e6b60e2eD30155f43D50b',
        serviceRegistryName: CONTRACT_NAMES.common.RETURN_FUNDS,
        history: [],
        constructorArgs: [],
      },
      AaveV3Borrow: {
        name: 'AaveV3Borrow',
        deploy: true,
        address: '0x645325494A37d35cf6baFc82C3e6bcE4473F2685',
        serviceRegistryName: CONTRACT_NAMES.aave.v3.BORROW,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Withdraw: {
        name: 'AaveV3Withdraw',
        deploy: true,
        address: '0xb3f0C5E4012aF22359c9Ab233DABd80cD81F5ec5',
        serviceRegistryName: CONTRACT_NAMES.aave.v3.WITHDRAW,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Deposit: {
        name: 'AaveV3Deposit',
        deploy: true,
        address: '0x2006d4e76A398c78964F7e311BFd7Ccb149EaFE2',
        serviceRegistryName: CONTRACT_NAMES.aave.v3.DEPOSIT,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3Payback: {
        name: 'AaveV3Payback',
        deploy: true,
        address: '0xA0Cb87300aB07D00468704cD8f016F8dE47D8E0A',
        serviceRegistryName: CONTRACT_NAMES.aave.v3.PAYBACK,
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
      AaveV3SetEMode: {
        name: 'AaveV3SetEMode',
        deploy: true,
        address: '',
        serviceRegistryName: 'AaveV3SetEMode',
        history: [],
        constructorArgs: ['address:ServiceRegistry'],
      },
    },
  },
  common: {
    WETH: {
      name: 'WETH',
      address: '0x4200000000000000000000000000000000000006',
      serviceRegistryName: 'WETH',
    },
    ETH: {
      name: 'ETH',
      address: '0x4200000000000000000000000000000000000006',
    },
    WSTETH: {
      name: 'WSTETH',
      address: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
      serviceRegistryName: 'WSTETH',
    },
    USDC: {
      name: 'USDC',
      address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
      serviceRegistryName: 'USDC',
    },
    DAI: {
      name: 'DAI',
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      serviceRegistryName: 'DAI',
    },
    WBTC: {
      name: 'WBTC',
      address: '0x68f180fcce6836688e9084f035309e29bf0a2095',
      serviceRegistryName: 'WBTC',
    },
    UniswapRouterV3: {
      name: 'UniswapRouterV3',
      address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      serviceRegistryName: 'UniswapRouter',
    },
    BalancerVault: {
      name: 'BalancerVault',
      address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      serviceRegistryName: 'BalancerVault',
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
      serviceRegistryName: 'OneInchAggregator',
    },
    ChainlinkEthUsdPriceFeed: {
      name: 'ChainlinkEthUsdPriceFeed',
      address: '0x13e3ee699d1909e989722e753853ae30b17e08c5',
    },
  },
  aave: {
    v3: {
      AaveOracle: {
        name: 'AaveOracle',
        address: '0xD81eb3728a631871a7eBBaD631b5f424909f0c77',
      },
      Pool: {
        name: 'Pool',
        address: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
        serviceRegistryName: 'AavePool',
      },
      AaveProtocolDataProvider: {
        name: 'AaveProtocolDataProvider',
        address: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
      },
    },
  },
  maker: {},
}