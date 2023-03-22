export const config = {
  mpa: {
    core: {
      ServiceRegistry: {
        name: 'ServiceRegistry',
        deploy: false,
        address: '0xf22F17B1D2354B4F4F52e4d164e4eB5e1f0A6Ba6',
        serviceRegistryName: '',
        history: [],
        constructorArgs: [ 0 ]
      },
      OperationExecutor: {
        name: 'OperationExecutor',
        deploy: false,
        address: '0x5AB3e51608cEa26090445CA89bc91628C8bB99f9',
        serviceRegistryName: 'OperationExecutor_2',
        history: [],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      OperationStorage: {
        name: 'OperationStorage',
        deploy: false,
        address: '0xd4FEaf1023CD6998053a1eb02460000980Cc908f',
        serviceRegistryName: 'OperationStorage_2',
        history: [],
        constructorArgs: [ 'address:ServiceRegistry', 'address:OperationExecutor' ]
      },
      OperationRegistry: {
        name: 'OperationsRegistry',
        deploy: false,
        address: '0x392ACeBea829373A3eFDc0dA80a16003106d8f6E',
        serviceRegistryName: 'OperationsRegistry_2',
        history: [],
        constructorArgs: []
      },
      AccountGuard: {
        name: 'AccountGuard',
        deploy: false,
        address: '0x63059cC2533344B65372983D4B6258b2cbbBF0Da',
        serviceRegistryName: '',
        history: [],
        constructorArgs: []
      },
      AccountFactory: {
        name: 'AccountFactory',
        deploy: false,
        address: '0xE166a06809FD35Cece10df9Cace87BbDB9a48F66',
        serviceRegistryName: '',
        history: [],
        constructorArgs: [ 'address:AccountGuard' ]
      }
    },
    actions: {
      PositionCreated: {
        name: 'PositionCreated',
        deploy: true,
        address: '0xE7aA0939F0cFF45162A22751CbE0009c689EA256',
        serviceRegistryName: 'PositionCreated',
        history: [],
        constructorArgs: []
      },
      SwapAction: {
        name: 'SwapAction',
        deploy: true,
        address: '0x55D4d311Cd9B2dD5693FB51f06DbE50B9Da84D13',
        serviceRegistryName: 'SwapAction_3',
        history: [],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      TakeFlashloan: {
        name: 'TakeFlashloan',
        deploy: true,
        address: '0x53958191c3077eDe3Ca90Eb840283df063FC1be3',
        serviceRegistryName: 'TakeFlashloan_3',
        history: [],
        constructorArgs: [
          'address:ServiceRegistry',
          '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1'
        ]
      },
      SetApproval: {
        name: 'SetApproval',
        deploy: true,
        address: '0x983EFCA0Fd5F9B03f75BbBD41F4BeD3eC20c96d8',
        serviceRegistryName: 'SetApproval_3',
        history: [],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      PullToken: {
        name: 'PullToken',
        deploy: true,
        address: '0xFAf9D0B7B92e8B281CaF10b42970179B45CA6412',
        serviceRegistryName: 'PullToken_3',
        history: [],
        constructorArgs: []
      },
      SendToken: {
        name: 'SendToken',
        deploy: true,
        address: '0xeB54C366512c4d59A222A251ea7316568859E08C',
        serviceRegistryName: 'SendToken_4',
        history: [],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      WrapEth: {
        name: 'WrapEth',
        deploy: true,
        address: '0x43C9a445fCf3bc3d1483c0b90DC0346249c0D84C',
        serviceRegistryName: 'WrapEth_3',
        history: [],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      UnwrapEth: {
        name: 'UnwrapEth',
        deploy: true,
        address: '0x7E7EB65A93441a2D2Bf0941216b4c1116B554d85',
        serviceRegistryName: 'UnwrapEth_3',
        history: [],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      ReturnFunds: {
        name: 'ReturnFunds',
        deploy: true,
        address: '0xAC0B1652388Ea425884e6b60e2eD30155f43D50b',
        serviceRegistryName: 'ReturnFunds_3',
        history: [],
        constructorArgs: []
      },
      AaveBorrow: {
        name: 'AaveBorrow',
        deploy: true,
        address: '0x645325494A37d35cf6baFc82C3e6bcE4473F2685',
        serviceRegistryName: 'AaveBorrow_3',
        history: [],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      AaveWithdraw: {
        name: 'AaveWithdraw',
        deploy: true,
        address: '0xb3f0C5E4012aF22359c9Ab233DABd80cD81F5ec5',
        serviceRegistryName: 'AaveWithdraw_3',
        history: [],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      AaveDeposit: {
        name: 'AaveDeposit',
        deploy: true,
        address: '0x2006d4e76A398c78964F7e311BFd7Ccb149EaFE2',
        serviceRegistryName: 'AaveDeposit_3',
        history: [],
        constructorArgs: [ 'address:ServiceRegistry' ]
      },
      AavePayback: {
        name: 'AavePayback',
        deploy: true,
        address: '0xA0Cb87300aB07D00468704cD8f016F8dE47D8E0A',
        serviceRegistryName: 'AavePayback_3',
        history: [],
        constructorArgs: [ 'address:ServiceRegistry' ]
      }
    }
  },
  common: {
    WETH: {
      name: 'WETH',
      address: '0x4200000000000000000000000000000000000006',
      serviceRegistryName: 'WETH'
    },
    ETH: {
      name: 'ETH',
      address: '0x4200000000000000000000000000000000000006',
      serviceRegistryName: 'ETH'
    },
    USDC: {
      name: 'USDC',
      address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
      serviceRegistryName: 'USDC'
    },
    DAI: {
      name: 'DAI',
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      serviceRegistryName: 'DAI'
    },
    UniswapRouterV3: {
      name: 'UniswapRouterV3',
      address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      serviceRegistryName: 'UniswapRouterV3'
    },
    BalancerVault: {
      name: 'BalancerVault',
      address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      serviceRegistryName: 'BalancerVault'
    }
  },
  aave: {
    v3: {
      AaveOracle: '',
      Pool: '0x485083b6c6028B11d644A81d580245D97a918F32',
      AaveProtocolDataProvider: ''
    }
  }
}