import { BigNumber } from 'ethers'

/**
 * Typescript implementation of the shares library from the Morpho contracts (SharesMathLib.sol)
 */
const VIRTUAL_SHARES = 1e6
const VIRTUAL_ASSETS = 1

export function mulDivDown(x: BigNumber, y: BigNumber, d: BigNumber): BigNumber {
  return x.mul(y).div(d)
}

export function mulDivUp(x: BigNumber, y: BigNumber, d: BigNumber): BigNumber {
  return x.mul(y).add(d.sub(1)).div(d)
}

export function toSharesDown(
  assets: BigNumber,
  totalAssets: BigNumber,
  totalShares: BigNumber,
): BigNumber {
  return mulDivDown(assets, totalShares.add(VIRTUAL_SHARES), totalAssets.add(VIRTUAL_ASSETS))
}

export function toAssetsDown(
  shares: BigNumber,
  totalAssets: BigNumber,
  totalShares: BigNumber,
): BigNumber {
  return mulDivDown(shares, totalAssets.add(VIRTUAL_ASSETS), totalShares.add(VIRTUAL_SHARES))
}

export function toSharesUp(
  assets: BigNumber,
  totalAssets: BigNumber,
  totalShares: BigNumber,
): BigNumber {
  return mulDivUp(assets, totalShares.add(VIRTUAL_SHARES), totalAssets.add(VIRTUAL_ASSETS))
}

export function toAssetsUp(
  shares: BigNumber,
  totalAssets: BigNumber,
  totalShares: BigNumber,
): BigNumber {
  return mulDivUp(shares, totalAssets.add(VIRTUAL_ASSETS), totalShares.add(VIRTUAL_SHARES))
}
