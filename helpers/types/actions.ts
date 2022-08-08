export const calldataTypes = {
  common: {
    Approval: 'tuple(address asset, address delegator, uint256 amount)',
    Swap: `tuple(address fromAsset,
    address toAsset,
    uint256 amount,
    uint256 receiveAtLeast,
    bytes withData) swapData`,
    SendToken: `tuple(address asset, address to, uint256 amount)`,
    PullToken: `tuple(address asset, address from, uint256 amount)`,
    TakeAFlashLoan: `tuple(uint256 amount, bool dsProxyFlashloan, (bytes32 targetHash, bytes callData)[] calls)`,
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
    Deposit: `tuple(address asset, uint256 amount)`,
    Withdraw: `tuple(address asset, uint256 amount)`,
    Borrow: `tuple(address asset, uint256 amount)`,
  },
  paramsMap: `uint8[] paramsMap`,
}
