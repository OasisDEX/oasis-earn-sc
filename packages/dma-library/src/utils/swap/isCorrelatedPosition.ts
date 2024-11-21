export function isCorrelatedPosition(symbolA: string, symbolB: string) {
  const correlatedAssetMatrix = [
    [
      'WETH',
      'ETH',
      'WSTETH',
      'CBETH',
      'RETH',
      'STETH',
      'OSETH',
      'WEETH',
      'EZETH',
      'AWSTETH',
      'ASETH',
      'CWETHV3',
      'WOETH',
      'BSDETH',
      'RSETH',
      'RSWETH',
      'WSUPEROETHB',
    ], // ETH correlated assets
    ['WBTC', 'TBTC', 'SWBTC', 'LBTC'], // BTC correlated assets
    ['USDC', 'DAI', 'GHO', 'SDAI', 'USDT', 'CDAI', 'AUSDC', 'PYUSD'], // USDC correlated assets
    // Add more arrays here to expand the matrix in the future
  ]

  // Iterate over each row in the matrix
  for (let i = 0; i < correlatedAssetMatrix.length; i++) {
    // Check if both symbols are in the same row
    if (
      correlatedAssetMatrix[i].includes(symbolA.toUpperCase()) &&
      correlatedAssetMatrix[i].includes(symbolB.toUpperCase())
    ) {
      return true
    }
  }

  // If we haven't found both symbols in the same row, they're not correlated
  return false
}
