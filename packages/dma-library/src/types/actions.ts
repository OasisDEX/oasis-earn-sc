const aaveLike = {
  Borrow: `tuple(address asset, uint256 amount, address to)`,
  Deposit: `tuple(address asset, uint256 amount, bool sumAmounts, bool setAsCollateral)`,
  Payback: `tuple(address asset, uint256 amount, bool paybackAll, address onBehalfOf)`,
  Withdraw: `tuple(address asset, uint256 amount, address to)`,
  SetEMode: `tuple(uint8 categoryId)`,
}

const morphoBlueMarketParams = `tuple(address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams`

export const calldataTypes = {
  common: {
    Approval: 'tuple(address asset, address delegate, uint256 amount, bool sumAmounts)',
    Swap: `tuple(address fromAsset,
    address toAsset,
    uint256 amount,
    uint256 receiveAtLeast,
    uint256 fee,
    bytes withData,
    bool collectFeeInFromToken) swapData`,
    SendToken: `tuple(address asset, address to, uint256 amount)`,
    WrapEth: `tuple(uint256 amount)`,
    UnwrapEth: `tuple(uint256 amount)`,
    ReturnFunds: `tuple(address asset)`,
    PullToken: `tuple(address asset, address from, uint256 amount)`,
    PositionCreated: `tuple(string protocol, string positionType, address collateralToken, address debtToken)`,
    TakeAFlashLoan: `tuple(uint256 amount, address asset, bool isProxyFlashloan, bool isDPMProxy, uint8 provider, (bytes32 targetHash, bytes callData, bool skipped)[] calls)`,
    TokenBalance: `tuple(address asset, address owner)`,
  },
  maker: {
    Open: `tuple(address joinAddress)`,
    Generate: `tuple(address to, uint256 vaultId, uint256 amount)`,
    Deposit: `tuple(address joinAddress, uint256 vaultId, uint256 amount)`,
    Withdraw: `tuple(uint256 vaultId, address userAddress, address joinAddr, uint256 amount)`,
    Payback: `tuple(uint256 vaultId, address userAddress, uint256 amount, bool paybackAll)`,
    CdpAllow: `tuple(uint256 vaultId, address userAddress)`,
  },
  aave: {
    Borrow: `tuple(address asset, uint256 amount, address to)`,
    Deposit: `tuple(address asset, uint256 amount, bool sumAmounts, bool setAsCollateral)`,
    Payback: `tuple(address asset, uint256 amount, bool paybackAll)`,
    Withdraw: `tuple(address asset, uint256 amount, address to)`,
  },
  aaveV3: {
    ...aaveLike,
  },
  spark: {
    ...aaveLike,
  },
  morphoblue: {
    Deposit: `tuple(${morphoBlueMarketParams}, uint256 amount, bool sumAmounts)`,
    Withdraw: `tuple(${morphoBlueMarketParams}, uint256 amount, address to)`,
    Borrow: `tuple(${morphoBlueMarketParams}, uint256 amount)`,
    Payback: `tuple(${morphoBlueMarketParams}, uint256 amount, address onBehalf)`,
  },
  ajna: {
    DepositBorrow: `tuple(address quoteToken, address collateralToken, uint256 depositAmount, uint256 borrowAmount, bool sumDepositAmounts, uint256 price)`,
    RepayWithdraw: `tuple(address quoteToken, address collateralToken, uint256 withdrawAmount, uint256 repayAmount, bool paybackAll, bool withdrawAll, uint256 price)`,
  },
  paramsMap: `uint8[] paramsMap`,
} as const
