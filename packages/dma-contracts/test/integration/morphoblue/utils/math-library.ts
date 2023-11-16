import { BigNumber } from 'ethers'

/**
 * Typescript implementation of the shares library from the Morpho contracts (SharesMathLib.sol)
 */
const VIRTUAL_SHARES = 1e6
const VIRTUAL_ASSETS = 1
const WAD = BigNumber.from(10).pow(18)

export function mulDivDown(x: BigNumber, y: BigNumber, d: BigNumber): BigNumber {
  return x.mul(y).div(d)
}

export function mulDivUp(x: BigNumber, y: BigNumber, d: BigNumber): BigNumber {
  return x.mul(y).add(d.sub(1)).div(d)
}

export function wMulDown(x: BigNumber, y: BigNumber): BigNumber {
  return mulDivDown(x, y, WAD)
}

export function wDivDown(x: BigNumber, y: BigNumber): BigNumber {
  return mulDivDown(x, WAD, y)
}

export function wDivUp(x: BigNumber, y: BigNumber): BigNumber {
  return mulDivUp(x, WAD, y)
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

export function applyTaylorCompounded(amount: BigNumber, rate: BigNumber): BigNumber {
  const firstTerm = amount.mul(rate)
  const secondTerm = mulDivDown(firstTerm, firstTerm, WAD.mul(2))
  const thirdTerm = mulDivDown(secondTerm, firstTerm, WAD.mul(3))

  return firstTerm.add(secondTerm).add(thirdTerm)
}
