export const config = {
  mpa: {
    core: {
      ServiceRegistry: {
        name: "ServiceRegistry",
        deploy: true,
        addresses: "",
        serviceRegistryName: "",
        history: [],
        constructorArgs: [0]
      },
      OperationExecutor: {
        name: "OperationExecutor",
        deploy: true,
        addresses: "",
        serviceRegistryName: "OperationExecutor_2",
        history: [],
        constructorArgs: ["address:ServiceRegistry"]
      },
      OperationStorage: {
        name: "OperationStorage",
        deploy: true,
        addresses: "",
        serviceRegistryName: "OperationStorage_2",
        history: [],
        constructorArgs: ["address:ServiceRegistry", "address:OperationExecutor"]
      },
      OperationRegistry: {
        name: "OperationsRegistry",
        deploy: true,
        addresses: "",
        serviceRegistryName: "OperationsRegistry_2",
        history: [],
        constructorArgs: []
      },
      AccountGuard: {
        name: "AccountGuard",
        deploy: true,
        addresses: "",
        serviceRegistryName: "",
        history: [],
        constructorArgs: []
      },
      AccountFactory: {
        name: "AccountFactory",
        deploy: true,
        addresses: "",
        serviceRegistryName: "",
        history: [],
        constructorArgs: ["address:AccountGuard"]
      }
    },
    actions: {
      PositionCreated: {
        name: "PositionCreated",
        deploy: true,
        addresses: "",
        serviceRegistryName: "PositionCreated",
        history: [],
        constructorArgs: []
      },
      SwapAction: {
        name: "SwapAction",
        deploy: true,
        addresses: "",
        serviceRegistryName: "SwapAction_3",
        history: [],
        constructorArgs: [
          "address:ServiceRegistry"
        ]
      },
      TakeFlashloan: {
        name: "TakeFlashloan",
        deploy: true,
        addresses: "",
        serviceRegistryName: "TakeFlashloan_3",
        history: [],
        constructorArgs: ["address:ServiceRegistry", "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1"]
      },
      SetApproval: {
        name: "SetApproval",
        deploy: true,
        addresses: "",
        serviceRegistryName: "SetApproval_3",
        history: [],
        constructorArgs: [
          "address:ServiceRegistry"
        ]
      },
      PullToken: {
        name: "PullToken",
        deploy: true,
        addresses: "",
        serviceRegistryName: "PullToken_3",
        history: [],
        constructorArgs: []
      },
      SendToken: {
        name: "SendToken",
        deploy: true,
        addresses: "",
        serviceRegistryName: "SendToken_4",
        history: [],
        constructorArgs: [
          "address:ServiceRegistry"
        ]
      },
      WrapEth: {
        name: "WrapEth",
        deploy: true,
        addresses: "",
        serviceRegistryName: "WrapEth_3",
        history: [],
        constructorArgs: [
          "address:ServiceRegistry"
        ]
      },
      UnwrapEth: {
        name: "UnwrapEth",
        deploy: true,
        addresses: "",
        serviceRegistryName: "UnwrapEth_3",
        history: [],
        constructorArgs: [
          "address:ServiceRegistry"
        ]
      },
      ReturnFunds: {
        name: "ReturnFunds",
        deploy: true,
        addresses: "",
        serviceRegistryName: "ReturnFunds_3",
        history: [],
        constructorArgs: []
      },
      AaveBorrow: {
        name: "AaveBorrow",
        deploy: true,
        addresses: "",
        serviceRegistryName: "AaveBorrow_3",
        history: [],
        constructorArgs: [
          "address:ServiceRegistry"
        ]
      },
      AaveWithdraw: {
        name: "AaveWithdraw",
        deploy: true,
        addresses: "",
        serviceRegistryName: "AaveWithdraw_3",
        history: [],
        constructorArgs: [
          "address:ServiceRegistry"
        ]
      },
      AaveDeposit: {
        name: "AaveDeposit",
        deploy: true,
        addresses: "",
        serviceRegistryName: "AaveDeposit_3",
        history: [],
        constructorArgs: [
          "address:ServiceRegistry"
        ]
      },
      AavePayback: {
        name: "AavePayback",
        deploy: true,
        addresses: "",
        serviceRegistryName: "AavePayback_3",
        history: [],
        constructorArgs: [
          "address:ServiceRegistry"
        ]
      }
    }
  },
  common: {
    WETH: {
      name: "WETH",
      address: "0x4200000000000000000000000000000000000006",
      serviceRegistryName: "WETH"
    },
    ETH: {
      name: "ETH",
      address: "0x4200000000000000000000000000000000000006",
      serviceRegistryName: "ETH"
    },
    USDC: {
      name: "USDC",
      address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
      serviceRegistryName: "USDC"
    },
    DAI: {
      name: "DAI",
      address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      serviceRegistryName: "DAI"
    },
    UniswapRouterV3: {
      name: "UniswapRouterV3",
      address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      serviceRegistryName: "UniswapRouterV3"
    },
    BalancerVault: {
      name: "BalancerVault",
      address: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
      serviceRegistryName: "BalancerVault"
    },
  },
  aave: {
    v3: {
      AaveOracle: "",
      Pool: "0x485083b6c6028B11d644A81d580245D97a918F32",
      AaveProtocolDataProvider: "",
    },
  },
}