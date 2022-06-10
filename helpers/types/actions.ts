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
    TakeAFlashLoan: `tuple(uint256 amount, address borrower, (bytes32 targetHash, bytes callData)[] calls)`,
  },
  maker: {
    Open: `tuple(address joinAddress, address mcdManager)`,
    Generate: `tuple(address to, address mcdManager, uint256 vaultId, uint256 amount)`,
    Deposit: `tuple(address joinAddress, address mcdManager, uint256 vaultId, uint256 amount)`,
    Withdraw: `tuple(uint256 vaultId, address userAddress, address joinAddr, address mcdManager, uint256 amount)`,
    Payback: `tuple(uint256 vaultId, address userAddress, address daiJoin, address mcdManager, uint256 amount, bool paybackAll)`,
  },
  aave: {
    Deposit: `tuple(address asset, uint256 amount)`,
    Generate: `tuple(address asset, uint256 amount)`,
    Withdraw: `tuple(address asset, uint256 amount)`,
  },
}
